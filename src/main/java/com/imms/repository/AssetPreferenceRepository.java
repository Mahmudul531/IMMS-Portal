package com.imms.repository;

import com.imms.model.entity.AssetPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetPreferenceRepository extends JpaRepository<AssetPreference, Long> {
    List<AssetPreference> findByPrefType(String prefType);
}
