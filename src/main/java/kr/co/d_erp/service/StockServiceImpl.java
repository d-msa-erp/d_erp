package kr.co.d_erp.service;

import java.util.List;

import org.springframework.stereotype.Service;

import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.repository.oracle.LoginRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockServiceImpl implements StockService{
	
	private final LoginRepository loginrepo;
	
	
	@Override
	public List<StockDto> getAllStocks(){
		
		
		return null;
		
	}
}
