# 获取报表值

<details open>
  <summary>通过类CL_SALV_BS_RUNTIME_INFO获取OOALV报表数据</summary>

```ABAP

  data lr_data type ref to data.
  field-symbols <fs_table> type standard table.
  
  " 获取设置
  call method cl_salv_bs_runtime_info=>set
    exporting
      display  = abap_false
      metadata = abap_false
      data     = abap_true .

  " 运行目标程序
  submit zreport and return.

  try.
    " 获取报表内容
    cl_salv_bs_runtime_info=>get_data_ref(
      importing
        r_data = lr_data ).
    assign lr_data->* to <fs_table>.
  catch cx_salv_bs_sc_runtime_info.
    message `Unable to retrieve ALV data` type 'E'.
  endtry.

  " 清空内存数据
  cl_salv_bs_runtime_info=>clear_all( ). 

```

</details>

<details open>
  <summary>通过LIST_TO_MEMORY，获取LIST报表</summary>

```ABAP

SUBMIT zreport EXPORTING LIST TO MEMORY AND RETURN. 

DATA lt_list TYPE TABLE OF abaplist.
CALL FUNCTION 'LIST_FROM_MEMORY' 
  TABLES 
    listobject = lt_list
  EXCEPTIONS 
    not_found  = 1 
    OTHERS     = 2. 

```

</details>
