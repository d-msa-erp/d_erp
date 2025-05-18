package kr.co.d_erp.controllers; 

import java.util.List;

import org.springframework.stereotype.Controller; 
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.annotation.Resource;
import kr.co.d_erp.daos.WarehouseDao;
import kr.co.d_erp.dtos.Warehouse;

import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("/warehouse")
@Slf4j
public class WarehouseController {

    @Resource(name="WarehouseDao")
    WarehouseDao whdao;

    // 창고 목록 전체 조회
    @GetMapping // GET /warehouse 에 매핑
    public String getWarehousePage(Model m) {
//        log.info(">>> getWarehousePage 메소드 호출: 창고 목록 페이지 로드");

        try {
        	List<Warehouse> warehouses = this.whdao.selectAllWarehouse();
//        	log.info("<<< {} 개의 창고 데이터 조회 완료", warehouses.size());
//        	log.info(warehouses.toString());
        	m.addAttribute("warehouses", warehouses);
        }catch (Exception e) {
        	log.info(e.toString()+"창고 목록 조회 실패");
		}

        return "/warehouse.html"; 
    }

}