package com.imms.controller;

import com.imms.model.entity.City;
import com.imms.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CityController {

    @Autowired
    private CityRepository cityRepository;

    @GetMapping
    public List<City> getAll() {
        return cityRepository.findAll();
    }

    @PostMapping
    public City create(@RequestBody City city) {
        return cityRepository.save(city);
    }

    @PutMapping("/{id}")
    public ResponseEntity<City> update(@PathVariable Long id, @RequestBody City cityDetails) {
        City city = cityRepository.findById(id).orElseThrow();
        city.setName(cityDetails.getName());
        city.setActive(cityDetails.getActive());
        return ResponseEntity.ok(cityRepository.save(city));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        cityRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
