package com.civicsync.backend.repository;

import com.civicsync.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    long countByRole(User.Role role);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
