package com.civicsync.backend.service;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

class CampaignEmailServiceTest {
    @Test
    @SuppressWarnings("unchecked")
    void emailsOnlyOptedInUsersNearVerifiedRequest() {
        CampaignRepository campaigns = mock(CampaignRepository.class);
        UserRepository users = mock(UserRepository.class);
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        JavaMailSender mail = mock(JavaMailSender.class);
        when(provider.getIfAvailable()).thenReturn(mail);
        when(provider.getObject()).thenReturn(mail);

        User requester = person(1L, "requester@example.com", "Mirpur");
        User near = person(2L, "near@example.com", "Mohammadpur");
        User far = person(3L, "far@example.com", "Sylhet");
        Campaign campaign = new Campaign();
        campaign.setId(10L); campaign.setRequester(requester);
        campaign.setTitle("Blood needed"); campaign.setLocation("Mirpur 10, Dhaka");
        campaign.setStatus(Campaign.VerificationStatus.VERIFIED);
        when(campaigns.findById(10L)).thenReturn(Optional.of(campaign));
        when(users.findByEmailAlertsEnabledTrue()).thenReturn(List.of(requester, near, far));

        new CampaignEmailService(campaigns, users, new AreaDirectory(), provider,
                "no-reply@example.com", "smtp.example.com", "https://civicsync.example")
                .sendAfterApproval(new CampaignPublishedEvent(10L));

        org.mockito.ArgumentCaptor<SimpleMailMessage> sent = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail, times(1)).send(sent.capture());
        org.junit.jupiter.api.Assertions.assertArrayEquals(new String[]{"near@example.com"}, sent.getValue().getTo());
        org.junit.jupiter.api.Assertions.assertTrue(sent.getValue().getText().contains("https://civicsync.example/post/10"));
    }

    private User person(Long id, String email, String area) {
        User user = new User(); user.setId(id); user.setEmail(email); user.setArea(area); return user;
    }
}
