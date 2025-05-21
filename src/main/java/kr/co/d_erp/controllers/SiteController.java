package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping; 
import org.springframework.web.bind.annotation.RequestBody; 
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; 
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException; 

import kr.co.d_erp.dtos.SiteDto;
import kr.co.d_erp.service.SiteService;

@RestController
@RequestMapping("/api/site")
@CrossOrigin(origins = "*")
public class SiteController {
	private final SiteService siteService;

	public SiteController(SiteService siteService) {
		this.siteService = siteService;
	}

	@GetMapping("/details")
	 public ResponseEntity<List<SiteDto>> findSitesByBizFlag(@RequestParam(defaultValue = "03") String bizFlag) {
        List<SiteDto> site = siteService.findSitesByBizFlag(bizFlag); // findByBizFlag03 -> findSitesByBizFlag로 변경
        return ResponseEntity.ok(site);
    }

	@PutMapping("/update") //사업장 업데이트용 api
	public ResponseEntity<SiteDto> updateSite(@RequestBody SiteDto siteDto){
		try {
			SiteDto updatedSite = siteService.updateSite(siteDto);
			return ResponseEntity.ok(updatedSite);
		} catch (RuntimeException e) {
			// 예외 메시지를 포함하여 NOT_FOUND (404) 응답 반환
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
		}
	}
}