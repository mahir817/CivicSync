package com.civicsync.backend.service;

import com.civicsync.backend.dto.LikeDtos.LikeResponse;
import com.civicsync.backend.entity.PostLike;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.PostLikeRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class LikeService {

    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final CivicReportRepository civicReportRepository;

    public LikeService(PostLikeRepository postLikeRepository,
                       UserRepository userRepository,
                       CampaignRepository campaignRepository,
                       CivicReportRepository civicReportRepository) {
        this.postLikeRepository = postLikeRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.civicReportRepository = civicReportRepository;
    }

    @Transactional(readOnly = true)
    public LikeResponse getLikes(PostLike.PostType postType, Long postId, String userEmail) {
        long count = postLikeRepository.countByPostTypeAndPostId(postType, postId);
        boolean liked = false;

        if (userEmail != null && !userEmail.isBlank()) {
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                liked = postLikeRepository.existsByPostTypeAndPostIdAndUser(postType, postId, userOpt.get());
            }
        }

        return new LikeResponse(count, liked);
    }

    @Transactional
    public LikeResponse toggleLike(PostLike.PostType postType, Long postId, String userEmail) {
        boolean exists = postType == PostLike.PostType.CAMPAIGN
                ? campaignRepository.existsById(postId)
                : civicReportRepository.existsById(postId);

        if (!exists) {
            throw new IllegalArgumentException("Post not found");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<PostLike> existingLike = postLikeRepository.findByPostTypeAndPostIdAndUser(postType, postId, user);

        boolean nowLiked;
        if (existingLike.isPresent()) {

            postLikeRepository.delete(existingLike.get());

            nowLiked = false;

        } else {

            PostLike newLike = new PostLike();

            newLike.setPostType(postType);
            newLike.setPostId(postId);
            newLike.setUser(user);

            postLikeRepository.save(newLike);

            nowLiked = true;
        }

        /*
        * Make sure INSERT/DELETE has actually been sent
        * to MySQL before querying the new count.
        */
        postLikeRepository.flush();

        long count =
                postLikeRepository.countByPostTypeAndPostId(
                        postType,
                        postId
                );

        return new LikeResponse(count, nowLiked);
    }
}
