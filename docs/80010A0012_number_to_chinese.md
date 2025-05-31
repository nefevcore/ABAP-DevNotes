# 数字转中文

网上不少代码出于性能考虑，会从数字分析，所以我试了下直接转到文本进行分析。

<details open>
  <summary>示例代码</summary>

```ABAP

FUNCTION zfm_fi_number_to_chinese.
*"----------------------------------------------------------------------
*"*"本地接口：
*"  IMPORTING
*"     REFERENCE(INPUT)
*"  EXPORTING
*"     REFERENCE(OUTPUT) TYPE  STRING
*"----------------------------------------------------------------------

  " 转换为数字格式
  DATA l_num TYPE p LENGTH 16 DECIMALS 2. " P(16,2)是可设置的最大范围
  TRY.
      l_num = input.
    CATCH cx_root.
      RETURN.
  ENDTRY.

  " 零值校验
  IF l_num = 0.
    output = '零元整'.
    RETURN.
  ENDIF.

  " 数字文本
  DATA(l_str) = |{ l_num NUMBER = RAW }|.
  REPLACE '.' IN l_str WITH space.

  " 数字大写对照
  TYPES:
    BEGIN OF ty_num_map,
      num    TYPE c LENGTH 1,
      num_cn TYPE c LENGTH 1,
    END OF ty_num_map.
  DATA lt_num_map TYPE HASHED TABLE OF ty_num_map WITH UNIQUE KEY num.
  lt_num_map = VALUE #(
    ( num = '0' num_cn = '零' )
    ( num = '1' num_cn = '壹' )
    ( num = '2' num_cn = '贰' )
    ( num = '3' num_cn = '叁' )
    ( num = '4' num_cn = '肆' )
    ( num = '5' num_cn = '伍' )
    ( num = '6' num_cn = '陆' )
    ( num = '7' num_cn = '柒' )
    ( num = '8' num_cn = '捌' )
    ( num = '9' num_cn = '玖' )
  ).

  " 预设表，解析文本后，数字逆序填入
  TYPES:
    BEGIN OF ty_nums,
      unit_cn TYPE char01,
      num_cn  TYPE char01,
    END OF ty_nums.
  DATA lt_nums TYPE STANDARD TABLE OF ty_nums WITH EMPTY KEY.
  lt_nums = VALUE #(
    ( unit_cn = '分' )
    ( unit_cn = '角' )
    ( unit_cn = '元' )
    ( unit_cn = '拾' )
    ( unit_cn = '佰' )
    ( unit_cn = '仟' )
    ( unit_cn = '万' )
    ( unit_cn = '拾' )
    ( unit_cn = '佰' )
    ( unit_cn = '仟' )
    ( unit_cn = '亿' )
    ( unit_cn = '拾' )
    ( unit_cn = '佰' )
    ( unit_cn = '仟' )
    ( unit_cn = '万' )
  ).

  " 从右到左，从分到亿，逐数字填表
  DATA(l_length) = strlen( l_str ).
  DO l_length TIMES.
    DATA(l_offset) = l_length - sy-index.
    lt_nums[ sy-index ]-num_cn = lt_num_map[ num = l_str+l_offset(1) ]-num_cn.
  ENDDO.
  DELETE lt_nums WHERE num_cn IS INITIAL. " 删除没填充的项

  " 没有小数位，要显示X元整
  IF lt_nums[ 1 ]-num_cn = '零' AND lt_nums[ 2 ]-num_cn = '零'.
    DELETE lt_nums FROM 1 TO 2.
    INSERT VALUE #( unit_cn = '整' ) INTO lt_nums INDEX 1.
  ENDIF.

  " 零值处理
  LOOP AT lt_nums REFERENCE INTO DATA(lr_nums) WHERE num_cn = '零'.
    CASE lr_nums->unit_cn.
      WHEN '分'. CLEAR lr_nums->*.
      WHEN '角'. CLEAR lr_nums->*.
      WHEN '元'. CLEAR lr_nums->num_cn.
      WHEN '万'. CLEAR lr_nums->num_cn.
      WHEN '亿'. CLEAR lr_nums->num_cn.
      WHEN OTHERS.
        CLEAR lr_nums->unit_cn.
    ENDCASE.
  ENDLOOP.
  DELETE ADJACENT DUPLICATES FROM lt_nums COMPARING ALL FIELDS.

  " 逐项拼接
  LOOP AT lt_nums REFERENCE INTO lr_nums.
    output = |{ lr_nums->num_cn }{ lr_nums->unit_cn }{ output }|.
  ENDLOOP.

  " 零值处理2
  REPLACE '零元' IN output WITH '元'.
  REPLACE ALL OCCURRENCES OF '零万' IN output WITH '万'.
  REPLACE ALL OCCURRENCES OF '零亿' IN output WITH '亿'.

ENDFUNCTION.

```

</details>
