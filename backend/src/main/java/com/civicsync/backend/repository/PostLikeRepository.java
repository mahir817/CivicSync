package com.civicsync.backend.repository;

import com.civicsync.backend.entity.PostLike;
import com.civicsync.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    long countByPostTypeAndPostId(PostLike.PostType postType, Long postId);

    boolean existsByPostTypeAndPostIdAndUser(PostLike.PostType postType, Long postId, User user);

    Optional<PostLike> findByPostTypeAndPostIdAndUser(PostLike.PostType postType, Long postId, User user);

    void deleteByPostTypeAndPostIdAndUser(PostLike.PostType postType, Long postId, User user);
}
