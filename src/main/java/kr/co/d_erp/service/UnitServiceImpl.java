package kr.co.d_erp.service;

import kr.co.d_erp.domain.Unit;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.repository.oracle.UnitRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class UnitServiceImpl implements UnitService {

    private final UnitRepository unitRepository;

    @Autowired
    public UnitServiceImpl(UnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @Override
    public List<UnitDto> getAllUnits() {
        return unitRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    public UnitDto saveUnit(UnitDto unitDto) {
        // DTO → Entity 변환
        Unit entity = convertToEntity(unitDto);
        // 저장 (PK 자동 생성되도록 Entity에 @GeneratedValue 설정 필요)
        Unit saved = unitRepository.save(entity);
        // 저장된 Entity → DTO 변환
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public void deleteUnit(Integer unitIdx) {
        // 1) 존재 여부 확인
        if (!unitRepository.existsById(unitIdx)) {
            throw new NoSuchElementException("삭제할 단위 정보가 없습니다. unitIdx=" + unitIdx);
        }
        // 2) 실제 삭제
        unitRepository.deleteById(unitIdx);
    }

    private UnitDto convertToDto(Unit unit) {
        return new UnitDto(unit.getUnitIdx(), unit.getUnitNm());
    }

    private Unit convertToEntity(UnitDto dto) {
        Unit unit = new Unit();
        // 신규 등록 시 dto.getUnitIdx() 는 null
        unit.setUnitNm(dto.getUnitNm());
        return unit;
    }
}
