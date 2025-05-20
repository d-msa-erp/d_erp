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
    
    // 등록
    public Custmst saveCustomer(Custmst custmst) {
        return custmstRepository.save(custmst);
    }
    
    // 수정
    public Custmst updateCustomer(Long custIdx, Custmst updatedCust) {
        // 기존 데이터 조회
        Custmst existingCust = custmstRepository.findById(custIdx)
            .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다: " + custIdx));

        // 수정할 필드들 업데이트
        existingCust.setCustNm(updatedCust.getCustNm());
        existingCust.setPresidentNm(updatedCust.getPresidentNm());
        existingCust.setBizNo(updatedCust.getBizNo());
        existingCust.setBizTel(updatedCust.getBizTel());
        existingCust.setCustEmail(updatedCust.getCustEmail());
        existingCust.setBizFax(updatedCust.getBizFax());
        existingCust.setBizCond(updatedCust.getBizCond());
        existingCust.setBizItem(updatedCust.getBizItem());
        existingCust.setCompEmpNm(updatedCust.getCompEmpNm());
        existingCust.setCompNo(updatedCust.getCompNo());
        existingCust.setBizAddr(updatedCust.getBizAddr());


        return custmstRepository.save(existingCust);
    }
    
    // 고객 삭제
    public void deleteCustomer(Long id) {
        custmstRepository.deleteById(id);
    }




}
