package com.civicsync.backend.repository;

import com.civicsync.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostTypeAndPostIdOrderByCreatedAtAsc(Comment.PostType postType, Long postId);
}