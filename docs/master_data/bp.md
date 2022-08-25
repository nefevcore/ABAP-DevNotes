# BP

业务伙伴由多个部分组成，可以分步执行，更可控。

## 基础信息

***BAPI_BUPA_CREATE_FROM_DATA***，创建业务伙伴。

***BAPI_BUPA_CENTRAL_CHANGE***，更改业务伙伴。

## 角色

***BAPI_BUPA_ROLE_ADD_2***，新增业务伙伴角色。

## 地址

***BAPI_BUPA_ADDRESS_ADD***，新增业务伙伴地址。

## 银行

***BAPI_BUPA_BANKDETAIL_ADD*** ，新增业务伙伴银行明细。

如果银行不存在，可以先使用 ***BAPI_BANK_CREATE*** 创建银行。

## 供应商

***VMD_EI_API***，新增客户，并关联业务伙伴。

## 客户

***CMD_EI_API***，新增供应商，并关联业务伙伴。

## 客商

<details>
  <summary>示例代码</summary>

```ABAP

TYPES:
  BEGIN OF ty_input,
    partner      TYPE but000-partner,
    bu_group     TYPE string,
    partner_kind TYPE string,
    name_org1    TYPE string,
    name_org2    TYPE string,
    name_org3    TYPE string,
    name_org4    TYPE string,
    street       TYPE string, " 注册地址
    country      TYPE string,
    tel_number   TYPE string,
    langu        TYPE string,
    idnumber     TYPE string,
    banks        TYPE string, " 银行所在国家
    bankl        TYPE string, " 银行代码
    bankn        TYPE string, " 银行账户
    koinh        TYPE string, " 银行持有人
    bukrs        TYPE string, " 公司
    akont        TYPE string, " 统驭科目
    waers        TYPE string, " 货币
  END OF ty_input.
TYPES tt_input TYPE STANDARD TABLE OF ty_input WITH EMPTY KEY.
DATA lt_input TYPE tt_input.

DATA lt_bapi_data TYPE cvis_ei_extern_t.
DATA ls_bapi_data TYPE cvis_ei_extern.
DATA l_task TYPE cmd_ei_object_task VALUE 'M'.

SELECT
  ds~partner,
  but000~partner_guid
  FROM @lt_input AS ds
  LEFT JOIN but000 ON ds~partner = but000~partner
  INTO TABLE @DATA(lt_but000).
SORT lt_but000 BY partner.
DELETE ADJACENT DUPLICATES FROM lt_but000 COMPARING partner.

" 考虑一个客商可能会有多行，先集中分配GUID
DATA l_partner_guid TYPE abap_bool.
LOOP AT lt_but000 REFERENCE INTO DATA(lr_but000) WHERE partner_guid IS INITIAL.
  TRY.
      l_partner_guid = cl_system_uuid=>if_system_uuid_static~create_uuid_x16( ).
    CATCH cx_root.
      CONTINUE.
  ENDTRY.
ENDLOOP.

" BAPI字段写入
LOOP AT lt_input INTO DATA(ls_input).
  CLEAR ls_bapi_data.

  " 标识需要更新的区域
  DATA l_customer TYPE abap_bool.
  DATA l_vender TYPE abap_bool.
  CLEAR l_customer.
  CLEAR l_vender.
  CASE ls_input-partner_kind.
    WHEN '1'.
      l_customer = abap_true.
    WHEN '2'.
      l_vender = abap_true.
    WHEN '3'.
      l_customer = abap_true.
      l_vender = abap_true.
    WHEN OTHERS.
      CONTINUE.
  ENDCASE.

  ls_input-partner = |{ ls_input-partner ALPHA = IN }|.

  " 获取分配的GUID字段
  READ TABLE lt_but000 INTO DATA(ls_but000) WITH KEY partner = ls_input-partner BINARY SEARCH.
  IF sy-subrc <> 0.
    CONTINUE.
  ENDIF.
  IF ls_but000-partner_guid IS INITIAL.
    CONTINUE.
  ENDIF.

  " 默认值
  ls_input-langu = '1'. " 1，ZH

  " 抬头数据
  ls_bapi_data-partner-header-object_task = l_task.
  ls_bapi_data-partner-header-object_instance-bpartner = ls_but000-partner.
  ls_bapi_data-partner-header-object_instance-bpartnerguid = ls_but000-partner_guid.

  " 分组
  ls_bapi_data-partner-central_data-common-data-bp_control-category = '2'. " 默认组织
  ls_bapi_data-partner-central_data-common-data-bp_control-grouping = ls_input-bu_group.

  " 角色
  DATA ls_role TYPE bus_ei_bupa_roles.
  CLEAR ls_role.
  ls_role-task = l_task.

  ls_role-data-valid_from = sy-datum.
  ls_role-datax-valid_from = 'X'.

  ls_role-data-valid_to = '99991231'.
  ls_role-datax-valid_to = 'X'.

  IF l_customer = abap_true.
    ls_role-data_key = 'FLCU00'.
    ls_role-data-rolecategory = ls_role-data_key.
    INSERT ls_role INTO TABLE ls_bapi_data-partner-central_data-role-roles.
    ls_role-data_key = 'FLCU01'.
    ls_role-data-rolecategory = ls_role-data_key.
    INSERT ls_role INTO TABLE ls_bapi_data-partner-central_data-role-roles.
  ENDIF.
  IF l_vender = abap_true.
    ls_role-data_key = 'FLVN00'.
    ls_role-data-rolecategory = ls_role-data_key.
    INSERT ls_role INTO TABLE ls_bapi_data-partner-central_data-role-roles.
    ls_role-data_key = 'FLVN01'.
    ls_role-data-rolecategory = ls_role-data_key.
    INSERT ls_role INTO TABLE ls_bapi_data-partner-central_data-role-roles.
  ENDIF.

  " 名称
  ls_bapi_data-partner-central_data-common-data-bp_organization-name1 = ls_input-name_org1.
  ls_bapi_data-partner-central_data-common-data-bp_organization-name2 = ls_input-name_org2.
  ls_bapi_data-partner-central_data-common-data-bp_organization-name3 = ls_input-name_org3.
  ls_bapi_data-partner-central_data-common-data-bp_organization-name4 = ls_input-name_org4.
  ls_bapi_data-partner-central_data-common-datax-bp_organization-name1 = abap_true.
  ls_bapi_data-partner-central_data-common-datax-bp_organization-name2 = abap_true.
  ls_bapi_data-partner-central_data-common-datax-bp_organization-name3 = abap_true.
  ls_bapi_data-partner-central_data-common-datax-bp_organization-name4 = abap_true.

  " 联系方法
  DATA ls_address TYPE bus_ei_bupa_address.
  DATA ls_phone TYPE bus_ei_bupa_telephone.
  CLEAR ls_address.
  CLEAR ls_phone.
  ls_address-task = l_task.
  ls_address-data_key-operation = 'XXDFLT'. " 标准
  ls_address-data-postal-data-street = ls_input-street.
  ls_address-data-postal-data-country = ls_input-country.
  ls_address-data-postal-data-langu = ls_input-langu.
  IF ls_input-tel_number IS NOT INITIAL.
    ls_phone-contact-task = l_task.
    ls_phone-contact-data-country = ls_input-country.
    ls_phone-contact-data-telephone = ls_input-tel_number.
    ls_phone-contact-datax-country = abap_true.
    ls_phone-contact-datax-telephone = abap_true.
    INSERT ls_phone INTO TABLE ls_address-data-communication-phone-phone.
  ENDIF.
  INSERT ls_address INTO TABLE ls_bapi_data-partner-central_data-address-addresses.

  " 标识
  DATA ls_identification TYPE bus_ei_bupa_identification.
  CLEAR ls_identification.
  ls_identification-task = l_task.
  ls_identification-data_key-identificationcategory = 'Z00001'.
  ls_identification-data_key-identificationnumber = ls_input-idnumber.
  INSERT ls_identification INTO TABLE ls_bapi_data-partner-central_data-ident_number-ident_numbers.

  " 银行
  DATA ls_bank TYPE bus_ei_bupa_bankdetail.
  CLEAR ls_bank.
  ls_bank-task = l_task.
  ls_bank-data_key = '0001'. " 固定，不会传两个银行数据吧？

  ls_bank-data-bank_ctry = ls_input-banks.
  ls_bank-datax-bank_ctry = abap_true.

  ls_bank-data-bank_key = ls_input-bankl.
  ls_bank-datax-bank_key = abap_true.

  ls_bank-data-bank_acct = ls_input-bankn.
  ls_bank-datax-bank_acct = abap_true.

  ls_bank-data-accountholder = ls_input-koinh.
  ls_bank-datax-accountholder = abap_true.

  INSERT ls_bank INTO TABLE ls_bapi_data-partner-central_data-bankdetail-bankdetails.

  " 供应商采购组织数据
  IF l_customer = abap_true.
    ls_bapi_data-customer-header-object_task = l_task.
    ls_bapi_data-customer-header-object_instance-kunnr = ls_but000-partner.

    DATA ls_company_custoner TYPE cmds_ei_company.
    DATA ls_sale TYPE cmds_ei_sales.

    " 客户公司数据
    CLEAR ls_company_custoner.
    ls_company_custoner-task = l_task.
    ls_company_custoner-data_key-bukrs = ls_input-bukrs.

    ls_company_custoner-data-zterm = 'Z001'.
    ls_company_custoner-datax-zterm = abap_true.

    ls_company_custoner-data-zuawa = '0009'.
    ls_company_custoner-datax-zuawa = abap_true.

    ls_company_custoner-data-akont = ls_input-akont.
    ls_company_custoner-datax-akont = abap_true.

    INSERT ls_company_custoner INTO TABLE ls_bapi_data-customer-company_data-company.

    " 客户销售数据
    CLEAR ls_sale.
    ls_sale-task = l_task.
    ls_sale-data_key-vkorg = ls_input-bukrs.
    ls_sale-data_key-spart = '10'.
    ls_sale-data_key-vtweg = '10'.

    ls_sale-data-kalks = 'B'.
    ls_sale-datax-kalks = abap_true.

    ls_sale-data-versg = '1'.
    ls_sale-datax-versg = abap_true.

    ls_sale-data-vsbed = '1'.
    ls_sale-datax-vsbed = abap_true.

    ls_sale-data-waers = ls_input-waers.
    ls_sale-datax-waers = abap_true.

    INSERT ls_sale INTO TABLE ls_bapi_data-customer-sales_data-sales.
  ENDIF.

  IF l_vender = abap_true.
    ls_bapi_data-vendor-header-object_task = l_task.
    ls_bapi_data-vendor-header-object_instance-lifnr = ls_but000-partner.

    DATA ls_company_vendor TYPE vmds_ei_company.
    DATA ls_purchasing TYPE vmds_ei_purchasing.

    " 供应商公司数据
    CLEAR ls_company_vendor.
    ls_company_vendor-task = l_task.
    ls_company_vendor-data_key-bukrs = ls_input-bukrs.
    
    ls_company_vendor-data-zterm = 'Z001'.
    ls_company_vendor-datax-zterm = abap_true.
    
    ls_company_vendor-data-zuawa = '0009'.
    ls_company_vendor-datax-zuawa = abap_true.
    
    ls_company_vendor-data-akont = ls_input-akont.
    ls_company_vendor-datax-akont = abap_true.
    
    INSERT ls_company_vendor INTO TABLE ls_bapi_data-vendor-company_data-company.

    " 供应商采购数据
    CLEAR ls_purchasing.
    ls_purchasing-task = l_task.
    ls_purchasing-data_key-ekorg = ls_input-bukrs.
    ls_purchasing-data-zterm = 'Z001'.

    ls_purchasing-data-kalsk = 'Z8'.
    ls_purchasing-datax-kalsk = abap_true.

    ls_purchasing-data-webre = 'X'.
    ls_purchasing-datax-webre = abap_true.

*    ls_purchasing-data-zterm = 'X'.
*    ls_purchasing-datax-zterm = abap_true.

    ls_purchasing-data-waers = ls_input-waers.
    ls_purchasing-datax-waers = abap_true.
    INSERT ls_purchasing INTO TABLE ls_bapi_data-vendor-purchasing_data-purchasing.
  ENDIF.

  INSERT ls_bapi_data INTO TABLE lt_bapi_data.
ENDLOOP.

DATA lt_bapiretm TYPE bapiretm.
CALL METHOD cl_md_bp_maintain=>maintain
  EXPORTING
    i_data   = lt_bapi_data
  IMPORTING
    e_return = lt_bapiretm.
IF sy-subrc = 0.
  CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
ELSE.
  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = 'X'.
ENDIF.

```

</details>
