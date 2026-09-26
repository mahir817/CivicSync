package com.civicsync.backend;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import com.civicsync.backend.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CoreWorkflowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired JwtUtil jwt;

    private User user(String email, User.Role role) {
        User u = new User();
        u.setEmail(email); u.setFullName(email); u.setPasswordHash("unused"); u.setRole(role);
        if (role == User.Role.VERIFIER) u.setVerifierCode(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        return users.save(u);
    }
    private String token(User u) { return "Bearer " + jwt.generateToken(u.getEmail(), u.getRole().name()); }
    private long id(MockHttpServletResponse response) throws Exception {
        return json.readTree(response.getContentAsString()).get("id").asLong();
    }

    @Test
    void registrationCannotGrantAdmin() throws Exception {
        MockMultipartFile registration = new MockMultipartFile("registration", "registration.json", "application/json",
                "{\"fullName\":\"Attacker\",\"email\":\"attacker@example.com\",\"password\":\"secret123\",\"phone\":\"01700000000\",\"area\":\"Mirpur\",\"identityDocumentType\":\"NID\",\"dateOfBirth\":\"2000-01-01\",\"bloodGroup\":\"O+\",\"emailAlertsEnabled\":true,\"role\":\"ADMIN\"}".getBytes());
        MockMultipartFile document = new MockMultipartFile("identityDocument", "nid.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        MockHttpServletResponse registered = mvc.perform(multipart("/api/auth/register").file(registration).file(document))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER"))
                .andReturn().getResponse();
        String bearer = "Bearer " + json.readTree(registered.getContentAsString()).get("token").asText();
        long ownerId = json.readTree(registered.getContentAsString()).get("userId").asLong();
        mvc.perform(get("/api/me").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.area").value("Mirpur"))
                .andExpect(jsonPath("$.bloodGroup").value("O+"))
                .andExpect(jsonPath("$.identityDocumentFile").doesNotExist());
        mvc.perform(get("/api/identity-documents/{id}", ownerId).header("Authorization", bearer))
                .andExpect(status().isOk());
        mvc.perform(get("/api/identity-documents/{id}", ownerId))
                .andExpect(status().isForbidden());
    }

    @Test
    void verificationReceiptAndCivicConfirmationRequireTheRightActor() throws Exception {
        User requester = user("requester@example.com", User.Role.USER);
        User donor = user("donor@example.com", User.Role.USER);
        User verifier = user("verifier@example.com", User.Role.VERIFIER);
        User otherVerifier = user("other-verifier@example.com", User.Role.VERIFIER);
        otherVerifier.getVerifierCategories().add(Campaign.Category.PET_CARE);
        users.save(otherVerifier);
        verifier.getVerifierCategories().add(Campaign.Category.BLOOD);
        verifier.getVerifierCategories().add(Campaign.Category.PET_CARE);
        users.save(verifier);

        mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Bad assignment\",\"description\":\"Treatment request\",\"category\":\"PET_CARE\",\"verifierCode\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());

        long campaignId = id(mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Vet care\",\"description\":\"Treatment request\",\"category\":\"PET_CARE\",\"location\":\"Dhaka\",\"goalAmount\":1000,\"verifierCode\":\"" + verifier.getVerifierCode() + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(get("/api/campaigns")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + campaignId + ")]").isEmpty());
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(status().isNotFound());
        mvc.perform(put("/api/campaigns/{id}/verify", campaignId).param("approve", "true")
                .header("Authorization", token(otherVerifier))).andExpect(status().isForbidden());
        mvc.perform(put("/api/campaigns/{id}/verify", campaignId).param("approve", "true")
                .header("Authorization", token(verifier))).andExpect(status().isOk());
        mvc.perform(get("/api/campaigns"))
                .andExpect(jsonPath("$[?(@.id == " + campaignId + ")]").isNotEmpty());

        long donationId = id(mvc.perform(post("/api/campaigns/{id}/donations", campaignId)
                .header("Authorization", token(donor)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"MONETARY\",\"amount\":100}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING_RECEIPT"))
                .andReturn().getResponse());
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(jsonPath("$.raisedAmount").value(0.0));
        mvc.perform(put("/api/campaigns/{id}/donations/{donationId}/confirm", campaignId, donationId)
                .header("Authorization", token(donor))).andExpect(status().isForbidden());
        mvc.perform(put("/api/campaigns/{id}/donations/{donationId}/confirm", campaignId, donationId)
                .header("Authorization", token(requester))).andExpect(status().isOk());
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(jsonPath("$.raisedAmount").value(100.0));
        mvc.perform(put("/api/campaigns/{id}/donations/{donationId}/confirm", campaignId, donationId)
                .header("Authorization", token(requester))).andExpect(status().isConflict());

        long reportId = id(mvc.perform(post("/api/civic-reports").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":23.8,\"longitude\":90.4,\"description\":\"Road flooded\"}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(post("/api/civic-reports/{id}/confirm", reportId)
                .header("Authorization", token(requester))).andExpect(status().isForbidden());
        mvc.perform(post("/api/civic-reports/{id}/confirm", reportId)
                .header("Authorization", token(donor))).andExpect(status().isOk());
        mvc.perform(post("/api/civic-reports/{id}/confirm", reportId)
                .header("Authorization", token(donor))).andExpect(status().isConflict());
        mvc.perform(put("/api/civic-reports/{id}/resolve", reportId)
                .header("Authorization", token(donor))).andExpect(status().isForbidden());
        mvc.perform(put("/api/civic-reports/{id}/resolve", reportId)
                .header("Authorization", token(requester))).andExpect(status().isOk());
    }

    @Test
    void adminManagesPartnersOutcomesAndDisputes() throws Exception {
        User admin = user("admin-workflow@example.com", User.Role.ADMIN);
        User requester = user("outcome-requester@example.com", User.Role.USER);
        User partner = user("partner-workflow@example.com", User.Role.USER);

        mvc.perform(patch("/api/admin/users/{id}", partner.getId())
                .header("Authorization", token(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"VERIFIER\",\"verifierCategories\":[\"BLOOD\",\"CHARITY\"],\"reviewed\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("VERIFIER"));

        long campaignId = id(mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Charity cause\",\"description\":\"Community support\",\"category\":\"CHARITY\",\"location\":\"Dhaka\",\"verifierCode\":\"" + users.findById(partner.getId()).orElseThrow().getVerifierCode() + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(get("/api/campaigns/pending").header("Authorization", token(partner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(put("/api/campaigns/{id}/verify", campaignId).param("approve", "true")
                .header("Authorization", token(admin))).andExpect(status().isOk());

        mvc.perform(post("/api/campaigns/{id}/outcome", campaignId)
                .header("Authorization", token(requester)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"summary\":\"Supplies delivered\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.outcomeSummary").doesNotExist());
        mvc.perform(get("/api/campaigns/outcomes/pending").header("Authorization", token(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].summary").value("Supplies delivered"));
        mvc.perform(put("/api/campaigns/{id}/outcome/approve", campaignId)
                .header("Authorization", token(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        long disputeId = id(mvc.perform(post("/api/disputes").header("Authorization", token(partner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"postType\":\"CAMPAIGN\",\"postId\":" + campaignId + ",\"reason\":\"Incorrect details\"}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(patch("/api/admin/disputes/{id}", disputeId)
                .param("status", "RESOLVED").param("action", "HIDE")
                .header("Authorization", token(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("HIDE"));
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(status().isNotFound());
    }

    @Test
    void bloodReviewRequestsInformationAndKeepsPledgeContactPrivate() throws Exception {
        User requester = user("blood-requester@example.com", User.Role.USER);
        User donor = user("blood-donor@example.com", User.Role.USER);
        donor.setArea("Dhanmondi"); donor.setBloodGroup("O+"); donor.setPhone("01700000000"); donor.setDonorOptIn(true);
        users.save(donor);
        User nearby = user("nearby-donor@example.com", User.Role.USER);
        nearby.setArea("Mirpur"); nearby.setBloodGroup("O+"); nearby.setDonorOptIn(true);
        users.save(nearby);
        User verifier = user("blood-partner@example.com", User.Role.VERIFIER);
        verifier.getVerifierCategories().add(Campaign.Category.BLOOD);
        users.save(verifier);
        String request = "{\"title\":\"O+ blood needed\",\"description\":\"Urgent surgery\",\"category\":\"BLOOD\",\"location\":\"Dhanmondi\",\"patientName\":\"Amina Rahman\",\"bloodType\":\"O+\",\"unitsNeeded\":2,\"hospital\":\"Delta Hospital\",\"urgency\":\"URGENT\",\"verifierCode\":\"" + verifier.getVerifierCode() + "\"}";
        mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Incomplete\",\"description\":\"Missing blood fields\",\"category\":\"BLOOD\"}"))
                .andExpect(status().isBadRequest());
        long campaignId = id(mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(put("/api/campaigns/{id}/review", campaignId)
                .header("Authorization", token(verifier)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"REJECT\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/campaigns/{id}/review", campaignId)
                .header("Authorization", token(verifier)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"REQUEST_INFO\",\"reason\":\"Please add a hospital document\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INFO_REQUESTED"));
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(status().isNotFound());
        mvc.perform(get("/api/campaigns/{id}", campaignId).header("Authorization", token(requester)))
                .andExpect(jsonPath("$.verificationNote").value("Please add a hospital document"));
        mvc.perform(patch("/api/campaigns/{id}", campaignId).header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(put("/api/campaigns/{id}/review", campaignId)
                .header("Authorization", token(verifier)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"APPROVE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("VERIFIED"));
        mvc.perform(post("/api/campaigns/{id}/donations", campaignId)
                .header("Authorization", token(donor)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"MONETARY\",\"amount\":100}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/blood-donors").header("Authorization", token(requester))
                .param("bloodGroup", "O+").param("area", "Dhanmondi"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(donor.getId()));
        long pledgeId = id(mvc.perform(post("/api/campaigns/{id}/donations", campaignId)
                .header("Authorization", token(donor)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"PLEDGE\",\"contactPhone\":\"01700000000\",\"message\":\"Available today\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PLEDGED")).andReturn().getResponse());
        mvc.perform(get("/api/campaigns/{id}/donations", campaignId))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].contactPhone").isEmpty())
                .andExpect(jsonPath("$[0].message").isEmpty());
        mvc.perform(get("/api/donations/pledges").header("Authorization", token(requester)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].contactPhone").value("01700000000"));
        mvc.perform(get("/api/donations/pledges").header("Authorization", token(donor)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/me/notifications").header("Authorization", token(requester)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.messageKey == 'NEW_PLEDGE')]").isNotEmpty());
        mvc.perform(put("/api/campaigns/{id}/donations/{pledgeId}/confirm-blood", campaignId, pledgeId)
                .header("Authorization", token(donor))).andExpect(status().isForbidden());
        mvc.perform(put("/api/campaigns/{id}/donations/{pledgeId}/confirm-blood", campaignId, pledgeId)
                .header("Authorization", token(requester))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        mvc.perform(get("/api/me").header("Authorization", token(donor)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nextEligibleAt").exists());
        mvc.perform(get("/api/campaigns/{id}", campaignId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.raisedAmount").value(0.0));
    }
}
