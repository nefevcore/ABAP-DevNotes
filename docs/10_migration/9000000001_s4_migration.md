# S4升级

S4升级后，通常会对整个项目做一次ATC检查，并根据检查来修复一些潜在问题，下面罗列一些我在调整过程中遇到的问题。

## 字段类型变更问题

升级后，部分字段的类型或长度被改变。这一般会导致函数参数不一致，更新内表字段不一致等通用的问题。此外还有以下一些比较特殊的问题。

### 物料

长度从18位改40位，通过函数 **CONVERSION_EXIT_ALPHA_INPUT** 转成内码的代码，这部分要按需更换成 **CONVERSION_EXIT_MATN1_INPUT**（40位）或 **CONVERSION_EXIT_MATN5_INPUT**（18位，未启用40位物料的情况）。

## 排序问题

相较于ECC取值后会默认排序，S4并没有这一步，这导致以下语法会出现预期外行为：

- **LOOP AT**
- **ADJACENT DUPLICATES**
- **READ BINARY**

加上默认排序即可解决。

## BSEG表取值问题

下面是两种处理方案：

### 保持原逻辑，通过增强，将凭证同时写入ACDOCA和BSEG表中

S4环境，除了部分如外币凭证，资产凭证等，SEG仍然会写入数据。因此只要对这些凭证做增强即可：

1. 实施 **BADI_FINS_FCV_BSTAT** 增强，使外币凭证写入BSEG生效，代码就用BADI的示例代码即可：

    <details open>
        <summary>示例代码</summary>

    ```ABAP

    IF cl_fins_acdoc_util=>is_currency_type_integrated( iv_company_code  = iv_bukrs
                                                        iv_currency_type = iv_currency_type ).
      RAISE ex_create_bseg.
    ENDIF.

    ```

    </details>

2. 对于资产凭证，使用财务替代（事务代码GGB1，财务抬头替代）。当参考过程 **BKPF-AWTYP=AMDP** 的时候，设置凭证状态 **BSTST=空**。

### 修改程序

将程序中从BSEG取值修改为从ACDOCA取值，并在取值后通过方法 **CL_FINS_ACDOC_TRANSFORM_UTIL=>TRANSFORM_ACDOCA_TO_BSEG** 将A表的值转换为B表的值。

> 注意，将BSEG改成ACDOCA取值，会导致更多的问题，比如缺少原因代码导致大改程序逻辑
>
> 所以实际项目上一般不改动，而是通过增强让凭证能同时写入BSEG即可

### 复合方案

实施增强，并将程序中不涉及特殊字段（原因代码等）的查询替换为ACDOCA表查询。

## 数据模型切换问题

类似BSEG切换ACDOCA，其他还有不少数据模型也有类似切换，下面罗列以下：

### 业务伙伴

业务伙伴主数据KNA1/LFA1等，切换为BUT000。这类模型切换基本可以忽略，因为BP数据更新的时候会同步更新KNA1/LFA1等。

对于客商客制化字段的处理，需要通过BDT方式增强到BP界面和主数据表，相关资料可在网上搜索。

> 假如自定义程序的修改量太大，可以考虑在增强中，将更新BP的客制化字段值，同步到KNA1/KNB1等数据表。

### 资产

详情参考[NOTE-2270387 S4TWL-资产会计：数据结构更改](https://me.sap.com/notes/2270387)

> 涉及权限问题，NOTE内容我就不放到这里了

简单来说，比如ANLP数据的读取需要用替代对象FAA_ANLP更换，其他模型也类似。但需要注意，如果程序中有直接用UPDATE等语法更新ANLP的，建议更换为用BAPI等方式更新。

> 目前我项目上没有直接更新的代码，暂无法提供实际例子

### 库存管理

详情参考[NOTE-2206980 物料库存管理中数据模型的更改](https://me.sap.com/notes/2206980)

和资产模型类似，相关表都存在替代对象NSDM_DDL_*，操作上也类似，不再讲述。

## FB切换BCS

由于变化实在太大，而且FB模块的表也还有历史数据，所以当前项目方案是忽略这两个模块涉及的东西，不做任何调整。

> [FBC和BCS数据表比对](https://help.sap.com/docs/SAP_ERP/0101f6d95e7246ba9f877f2c7b216bba/5ceccc53a8b77214e10000000a174cb4.html)

## 跳转问题

- 跳转FB03，改用函数 **MIGO_DIALOG** 执行事务跳转功能
