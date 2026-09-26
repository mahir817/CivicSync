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
        return users.save(u);
    }
    private String token(User u) { return "Bearer " + jwt.generateToken(u.getEmail(), u.getRole().name()); }
    private long id(MockHttpServletResponse response) throws Exception {
        return json.readTree(response.getContentAsString()).get("id").asLong();
    }

    @Test
    void registrationCannotGrantAdmin() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Attacker\",\"email\":\"attacker@example.com\",\"password\":\"secret123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void verificationReceiptAndCivicConfirmationRequireTheRightActor() throws Exception {
        User requester = user("requester@example.com", User.Role.USER);
        User donor = user("donor@example.com", User.Role.USER);
        User verifier = user("verifier@example.com", User.Role.VERIFIER);
        verifier.getVerifierCategories().add(Campaign.Category.PET_CARE);
        users.save(verifier);

        long campaignId = id(mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Need blood\",\"description\":\"Hospital request\",\"category\":\"BLOOD\",\"location\":\"Dhaka\",\"goalAmount\":1000}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(get("/api/campaigns")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/campaigns/{id}", campaignId)).andExpect(status().isNotFound());
        mvc.perform(put("/api/campaigns/{id}/verify", campaignId).param("approve", "true")
                .header("Authorization", token(verifier))).andExpect(status().isForbidden());
        verifier.getVerifierCategories().add(Campaign.Category.BLOOD);
        users.save(verifier);
        mvc.perform(put("/api/campaigns/{id}/verify", campaignId).param("approve", "true")
                .header("Authorization", token(verifier))).andExpect(status().isOk());
        mvc.perform(get("/api/campaigns")).andExpect(jsonPath("$.length()").value(1));

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
                .content("{\"role\":\"VERIFIER\",\"verifierCategories\":[\"BLOOD\"],\"reviewed\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("VERIFIER"));

        long campaignId = id(mvc.perform(post("/api/campaigns").header("Authorization", token(requester))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Charity cause\",\"description\":\"Community support\",\"category\":\"CHARITY\",\"location\":\"Dhaka\"}"))
                .andExpect(status().isOk()).andReturn().getResponse());
        mvc.perform(get("/api/campaigns/pending").header("Authorization", token(partner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
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
}
