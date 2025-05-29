package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.domain.ProductionPlanView;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.ProductionPlanDto;
import kr.co.d_erp.service.ProductionPlanService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ProductionPlanController {

    private final ProductionPlanService service;

    
    @GetMapping("/api/production/orders")
    public List<ProductionPlanView> getAllProductionPlans() {
        return service.getAll();
    }
    
    @PostMapping("/api/production/plan")
    public ResponseEntity<?> applyProductionPlan(@RequestBody ProductionPlanDto req) {
        InvTransactionResponseDto result = service.applyProductionPlan(req);
        return ResponseEntity.ok(result);
    }


}
