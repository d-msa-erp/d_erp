package kr.co.d_erp.service;

import kr.co.d_erp.dtos.UnitDto;
import java.util.List;

public interface UnitService {
    List<UnitDto> getAllUnits();
    // 단위 저장(Create)
    UnitDto saveUnit(UnitDto unitDto);

    // 단위 삭제(Delete)
    void deleteUnit(Integer unitIdx);
}