package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import kr.co.d_erp.dtos.Custmst;
import kr.co.d_erp.repository.oracle.CustmstRepository;

@Service
public class CustmstService {

    @Autowired
    private CustmstRepository custmstRepository;

    public List<Custmst> getCustomersByBizFlag(String bizFlag) {
        // bizFlag로 조회하는 쿼리 실행 (예시)
        return custmstRepository.findByBizFlag(bizFlag);
    }
    
    // 상세 조회
    public Optional<Custmst> getCustomerById(Long id) {
        return custmstRepository.findById(id);
    }
    
    // 고객 등록
    public Custmst createCustomer(Custmst custmst) {
        return custmstRepository.save(custmst);
    }
    
    // 고객 수정
    public Custmst updateCustomer(Custmst custmst) {
        return custmstRepository.save(custmst);
    }
    
    // 고객 삭제
    public void deleteCustomer(Long id) {
        custmstRepository.deleteById(id);
    }




}
