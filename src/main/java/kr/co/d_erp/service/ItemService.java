package kr.co.d_erp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import kr.co.d_erp.dtos.Item;
import kr.co.d_erp.mappers.ItemMapper;

@Service
public class ItemService {

	private final ItemMapper itemMapper;

	@Autowired
	public ItemService(ItemMapper itemMapper) {
		this.itemMapper = itemMapper;
	}
	public List<Item> getAllItem() {
		return itemMapper.selectALLItem();
	}
	public List<Item> getPagingItem(Pageable pageable) {
	    int offset = pageable.getPageNumber() * pageable.getPageSize();
	    int pageSize = pageable.getPageSize();
	    return itemMapper.selectPagingItem(offset, pageSize);
	}

	public long getTotalItemCount() {
	    return itemMapper.selectCountItem();
	}
}