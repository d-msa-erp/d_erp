package kr.co.d_erp.service;


import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.repository.oracle.BomDtlRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BomDtlService {

    private final BomDtlRepository repository;

    public BomDtlService(BomDtlRepository repository) {
        this.repository = repository;
    }

    public List<BomDtl> getAllBoms() {
        return repository.findAll();
    }

    public BomDtl saveBom(BomDtl bomDtl) {
        return repository.save(bomDtl);
    }
}