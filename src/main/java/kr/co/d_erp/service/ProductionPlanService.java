package kr.co.d_erp.service;

import java.util.List;


import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.ProductionPlanView;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.ProductionPlanDto;
import kr.co.d_erp.repository.oracle.ProductionPlanViewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductionPlanService {

     private final InvTransactionService invTransactionService;
	 private final ProductionPlanViewRepository repository;

	 
	 public List<ProductionPlanView> getAll() {
	        return repository.findAll();
	 }
	 
	 @Transactional
	 public InvTransactionResponseDto applyProductionPlan(ProductionPlanDto req) {
	     InvTransactionRequestDto dto = new InvTransactionRequestDto();
	     dto.setTransType("R");
	     dto.setTransStatus("R3");
	     dto.setItemIdx(req.getItemIdx());
	     dto.setTransQty(req.getQuantity());
	     dto.setUnitPrice(req.getUnitPrice());
	     dto.setWhIdx(req.getWhIdx());
	     dto.setCustIdx(req.getCustIdx());
	     dto.setUserIdx(req.getUserIdx());
	     
	     System.out.println(dto.getWhIdx());
	     System.out.println(dto.getCustIdx());
	     return invTransactionService.insertTransaction(dto);
	 }
}
