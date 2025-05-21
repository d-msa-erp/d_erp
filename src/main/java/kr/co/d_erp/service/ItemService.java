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
	
    public Item getItemById(int item_IDX) {
        // ItemMapper에 해당 ID로 품목을 조회하는 메서드가 필요합니다.
        return itemMapper.selectItemById(item_IDX);
    }

    public void updateItem(Item item) {
        // ItemMapper에 품목 정보를 업데이트하는 메서드가 필요합니다.
        itemMapper.updateItem(item);
    }
}