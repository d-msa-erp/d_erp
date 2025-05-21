package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.service.WhmstService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class WhmstController {

	private final WhmstService whmstService;

	// 창고 데이터 API 엔드포인트 (정렬 및 검색 지원)
	@GetMapping("/api/warehouses")
	@ResponseBody
	public ResponseEntity<List<Whmst>> getWarehouses(
			@RequestParam(name = "sortBy", defaultValue = "whIdx") String sortBy,
			@RequestParam(name = "sortDirection", defaultValue = "asc") String sortDirection,
			@RequestParam(name = "keyword", required = false) String keyword) {

		List<Whmst> warehouses = whmstService.findAllWarehouses(sortBy, sortDirection, keyword);
		return ResponseEntity.ok(warehouses);
	}
}