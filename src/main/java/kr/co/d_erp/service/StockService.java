package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional;

import kr.co.d_erp.dtos.StockDto;

public interface StockService {

	List<StockDto> getAllStocks();
}
