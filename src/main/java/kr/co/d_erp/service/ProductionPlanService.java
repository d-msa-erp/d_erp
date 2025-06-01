package kr.co.d_erp.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.Production;
import kr.co.d_erp.domain.ProductionPlanView;
import kr.co.d_erp.dtos.InvTransactionRequestDto;
import kr.co.d_erp.dtos.InvTransactionResponseDto;
import kr.co.d_erp.dtos.ProductionPlanDto;
import kr.co.d_erp.repository.oracle.ProductionPlanViewRepository;
import kr.co.d_erp.repository.oracle.ProductionRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductionPlanService {

	private final InvTransactionService invTransactionService;
	private final ProductionPlanViewRepository repository;
	private final ProductionRepository productionRepository;

	public List<ProductionPlanView> getAll() {
		return repository.findAll();
	}

	@Transactional
	public InvTransactionResponseDto applyProductionPlan(ProductionPlanDto req) {
		Production production = new Production();
		production.setProdCode(generateProdCode()); // 생산 코드 생성 로직 필요
		production.setItemIdx(req.getItemIdx());
		production.setOrderIdx(req.getOrderIdx()); // null 허용
		production.setProdQty(req.getQuantity());
		production.setProdDate(LocalDate.now());
		production.setProdStatus("02"); // 생산전
		production.setTargetWhIdx(req.getWhIdx()); // 입고될 창고
		production.setUserIdx(req.getUserIdx());

		productionRepository.save(production);

		InvTransactionRequestDto dto = new InvTransactionRequestDto();
		dto.setTransType("R");
		dto.setTransStatus("R3");
		dto.setItemIdx(req.getItemIdx());
		dto.setTransQty(req.getQuantity());
		dto.setUnitPrice(req.getUnitPrice());
		dto.setWhIdx(req.getWhIdx());
		dto.setCustIdx(req.getCustIdx());
		dto.setUserIdx(req.getUserIdx());

		return invTransactionService.insertTransaction(dto);
	}
	
	private String generateProdCode() {
	    String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
	    long seq = productionRepository.countByProdDate(LocalDate.now()) + 1;
	    return "PRD" + datePart + String.format("%03d", seq);
	}
}
