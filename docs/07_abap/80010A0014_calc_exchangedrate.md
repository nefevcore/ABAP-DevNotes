# 汇率计算工具

ABAP内取汇率需要考虑正向和反向，所以写个工具同时处理正向和反向的情况

<details open>
  <summary>示例代码</summary>

```ABAP

class ZCL_EXCHANGE_RATE definition
  public
  final
  create public .

public section.

  types TY_EXCHANGE_RATE type F .
  types:
    BEGIN OF ty_exchangerete_cache,
        from          TYPE waers,
        to            TYPE waers,
        date          TYPE d,
        exchange_rate TYPE ty_exchange_rate,
      END OF ty_exchangerete_cache .

  class-data:
    gt_exchangerete_cache TYPE SORTED TABLE OF ty_exchangerete_cache WITH NON-UNIQUE KEY from to date .

  class-methods GET_EXCHANGERATE
    importing
      !I_RATE_TYPE type BAPI1093_1-RATE_TYPE default 'M'
      !I_FROM type WAERS
      !I_TO type WAERS
      !I_DATE type DATUM default SY-DATUM
    returning
      value(R_EXCHANGERATE) type TY_EXCHANGE_RATE .
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.



CLASS ZCL_EXCHANGE_RATE IMPLEMENTATION.


* <SIGNATURE>---------------------------------------------------------------------------------------+
* | Static Public Method ZCL_EXCHANGE_RATE=>GET_EXCHANGERATE
* +-------------------------------------------------------------------------------------------------+
* | [--->] I_RATE_TYPE                    TYPE        BAPI1093_1-RATE_TYPE (default ='M')
* | [--->] I_FROM                         TYPE        WAERS
* | [--->] I_TO                           TYPE        WAERS
* | [--->] I_DATE                         TYPE        DATUM (default =SY-DATUM)
* | [<-()] R_EXCHANGERATE                 TYPE        TY_EXCHANGE_RATE
* +--------------------------------------------------------------------------------------</SIGNATURE>
  METHOD get_exchangerate.

    IF i_from = i_to.
      r_exchangerate = 1.
      RETURN.
    ENDIF.

    READ TABLE gt_exchangerete_cache REFERENCE INTO DATA(lr_cache) WITH KEY
    from = i_from
    to = i_to
    date = i_date
    BINARY SEARCH.
    IF sy-subrc = 0.
      r_exchangerate = lr_cache->exchange_rate.
      RETURN.
    ENDIF.

    " 汇率转换公式：
    " exchange rate = ( To Amount / To Factor ) / ( From Amount / From Factor )

    " 化简一下：
    " exchange rate * From Amount * To Factor = To Amount * From Factor

    " 所以当正向的时候：
    " To Amount = From Amount * ( exchange rate * To Factor ) / From Factor

    " 所以当反向的时候：
    " From Amount = To Amount * From Factor / ( exchange rate * To Factor )

    DATA ls_rate TYPE bapi1093_0.
    ##NEEDED
    DATA ls_bapiret1 TYPE bapiret1.

    " 正向汇率
    CALL FUNCTION 'BAPI_EXCHANGERATE_GETDETAIL'
      EXPORTING
        rate_type  = i_rate_type
        from_curr  = i_from
        to_currncy = i_to
        date       = i_date
      IMPORTING
        exch_rate  = ls_rate
        return     = ls_bapiret1.
    IF sy-subrc <> 0.
      ls_bapiret1-type = zif_constant=>error.
    ENDIF.

    IF ls_bapiret1 IS INITIAL.
      IF ls_rate-from_factor IS NOT INITIAL.
        r_exchangerate = ( ls_rate-exch_rate * ls_rate-to_factor ) / ls_rate-from_factor.
      ENDIF.
      INSERT VALUE #(
        from = i_from
        to = i_to
        date = i_date
        exchange_rate = r_exchangerate
      ) INTO TABLE gt_exchangerete_cache.
      RETURN.
    ENDIF.

    " 如果没有就按反向汇率计算
    CLEAR ls_rate.
    CLEAR ls_bapiret1.
    CALL FUNCTION 'BAPI_EXCHANGERATE_GETDETAIL'
      EXPORTING
        rate_type  = i_rate_type
        from_curr  = i_to
        to_currncy = i_from
        date       = i_date
      IMPORTING
        exch_rate  = ls_rate
        return     = ls_bapiret1.
    IF sy-subrc <> 0.
      ls_bapiret1-type = zif_constant=>error.
    ENDIF.

    IF ls_bapiret1 IS INITIAL.
      IF ls_rate-exch_rate IS NOT INITIAL AND ls_rate-to_factor IS NOT INITIAL.
        r_exchangerate = ls_rate-from_factor / ( ls_rate-exch_rate * ls_rate-to_factor ).
      ENDIF.
      INSERT VALUE #(
        from = i_from
        to = i_to
        date = i_date
        exchange_rate = r_exchangerate
      ) INTO TABLE gt_exchangerete_cache.
      RETURN.
    ENDIF.

  ENDMETHOD.


ENDCLASS.

```

</details>
