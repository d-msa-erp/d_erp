package kr.co.d_erp.service;

import java.util.List;

import kr.co.d_erp.dtos.SiteDto;

public interface SiteService {
    List<SiteDto> findSitesByBizFlag(String bizFlag);

    SiteDto updateSite(SiteDto siteDto);
    SiteDto createSite(SiteDto siteDto);
}