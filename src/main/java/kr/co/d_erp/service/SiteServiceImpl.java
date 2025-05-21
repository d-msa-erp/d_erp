package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional; // Optional 임포트 추가
import java.util.stream.Collectors; // Collectors 임포트 추가

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <--- jakarta.transaction.Transactional 대신 이 것으로 변경해주세요.

import kr.co.d_erp.domain.Site;
import kr.co.d_erp.dtos.SiteDto;
import kr.co.d_erp.repository.oracle.SiteRepository;

@Service
public class SiteServiceImpl implements SiteService {
    private final SiteRepository siteRepository;

    @Autowired
    public SiteServiceImpl(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @Override
    public List<SiteDto> findSitesByBizFlag(String bizFlag) { // findByBizFlag03 -> findSitesByBizFlag로 변경
        List<Site> sites = siteRepository.findByBizFlag(bizFlag);

        return sites.stream().map(site -> {
            SiteDto dto = new SiteDto();
            dto.setCustCd(site.getCustCd());
            dto.setSiteNm(site.getCustNm());
            dto.setCeoNm(site.getPresidentNm());
            dto.setBizNo(site.getBizNo());
            dto.setCompNo(site.getCompNo());
            dto.setCorpRegNo(site.getCorpRegNo());
            dto.setBizCond(site.getBizCond());
            dto.setBizItem(site.getBizItem());
            dto.setBizTel(site.getBizTel());
            dto.setBizFax(site.getBizFax());
            dto.setBizAddr(site.getBizAddr());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional // <--- @Transactional 어노테이션은 메서드 위에 위치합니다.
    @Override
    public SiteDto updateSite(SiteDto siteDto) { // <--- 이 메서드가 현재 파일에 없습니다. 추가해주세요.
        Optional<Site> optionalSite = siteRepository.findById(siteDto.getCustCd());

        if (optionalSite.isPresent()) {
            Site site = optionalSite.get();

            site.setCustNm(siteDto.getSiteNm());
            site.setPresidentNm(siteDto.getCeoNm());
            site.setBizNo(siteDto.getBizNo());
            site.setCompNo(siteDto.getCompNo());
            site.setCorpRegNo(siteDto.getCorpRegNo());
            site.setBizCond(siteDto.getBizCond());
            site.setBizItem(siteDto.getBizItem());
            site.setBizTel(siteDto.getBizTel());
            site.setBizFax(siteDto.getBizFax());
            site.setBizAddr(siteDto.getBizAddr());

            // 필요한 경우 bizFlag도 업데이트할 수 있습니다.
            // site.setBizFlag("03"); // 또는 DTO에서 받아온 값으로 설정

            Site updatedSite = siteRepository.save(site);

            SiteDto updatedDto = new SiteDto();
            updatedDto.setCustCd(updatedSite.getCustCd());
            updatedDto.setSiteNm(updatedSite.getCustNm());
            updatedDto.setCeoNm(updatedSite.getPresidentNm());
            updatedDto.setBizNo(updatedSite.getBizNo());
            updatedDto.setCompNo(updatedSite.getCompNo());
            updatedDto.setCorpRegNo(updatedSite.getCorpRegNo());
            updatedDto.setBizCond(updatedSite.getBizCond());
            updatedDto.setBizItem(updatedSite.getBizItem());
            updatedDto.setBizTel(updatedSite.getBizTel());
            updatedDto.setBizFax(updatedSite.getBizFax());
            updatedDto.setBizAddr(updatedSite.getBizAddr());

            return updatedDto;
        } else {
            throw new RuntimeException("Site with custCd " + siteDto.getCustCd() + " not found for update.");
        }
    }
}