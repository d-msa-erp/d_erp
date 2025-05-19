package kr.co.d_erp.controllers;

import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.service.BomDtlService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bom")
public class BomDtlController {

    private final BomDtlService service;

    public BomDtlController(BomDtlService service) {
        this.service = service;
    }

    @GetMapping
    public List<BomDtl> getAllBoms() {
        return service.getAllBoms();
    }

    @PostMapping
    public BomDtl createBom(@RequestBody BomDtl bomDtl) {
        return service.saveBom(bomDtl);
    }
}
