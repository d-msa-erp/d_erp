package kr.co.d_erp.controllers; 

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.service.UnitService;

@RestController
@RequestMapping("/api/unit") // API 엔드포인트 경로
@CrossOrigin(origins = "*")
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    //조회용
    @GetMapping("/details")
    public ResponseEntity<List<UnitDto>> getAllUnits() {
        List<UnitDto> units = unitService.getAllUnits();
        return ResponseEntity.ok(units);
    }
    

    // 생성
    @PostMapping
    public ResponseEntity<UnitDto> createUnit(@RequestBody UnitDto dto) {
        UnitDto created = unitService.saveUnit(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    //삭제
    @DeleteMapping("/{unitIdx}")
    public ResponseEntity<Void> deleteUnit(@PathVariable("unitIdx") Integer unitIdx) {
        unitService.deleteUnit(unitIdx);
        return ResponseEntity.noContent().build();
    }
}