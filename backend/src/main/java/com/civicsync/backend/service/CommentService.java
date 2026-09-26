package com.civicsync.backend.service;

import com.civicsync.backend.dto.CommentDtos.*;
import com.civicsync.backend.entity.Comment;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.CommentRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final CivicReportRepository civicReportRepository;

    public CommentService(CommentRepository commentRepository, UserRepository userRepository,
                           CampaignRepository campaignRepository, CivicReportRepository civicReportRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.civicReportRepository = civicReportRepository;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getFor(Comment.PostType postType, Long postId) {
        return commentRepository.findByPostTypeAndPostIdOrderByCreatedAtAsc(postType, postId)
                .stream().map(CommentResponse::from).toList();
    }

    @Transactional
    public CommentResponse create(Comment.PostType postType, Long postId, CreateCommentRequest req, String authorEmail) {
        // Confirm the target post actually exists before allowing a comment on it
        boolean exists = postType == Comment.PostType.CAMPAIGN
                ? campaignRepository.existsById(postId)
                : civicReportRepository.existsById(postId);
        if (!exists) {
            throw new IllegalArgumentException("Post not found");
        }

        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = new Comment();
        comment.setPostType(postType);
        comment.setPostId(postId);
        comment.setAuthor(author);
        comment.setContent(req.content());

        return CommentResponse.from(commentRepository.save(comment));
    }
}