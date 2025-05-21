package kr.co.d_erp.service;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WhmstService {

    private final WhmstRepository whmstRepository;

    public List<Whmst> findAllWarehouses(String sortBy, String sortDirection, String keyword) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        // 클라이언트에서 전달된 sortBy 값을 사용하여 Sort 객체 생성
        Sort sort = Sort.by(direction, sortBy);
        return whmstRepository.findAllWarehousesByKeyword(keyword, sort);
    }
}