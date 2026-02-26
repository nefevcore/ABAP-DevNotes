# Cloud开发概览

近期出现些CleanCore的项目，核心是尽可能减少定制开发（优先使用Cloud的应用，其次是公共接口，最后才是定制化开发），定制开发也有些变化：

- 弃用ALV，替换为基于CDS构建的模板页面
- 如BAPI等功能调用，替换为SAP的公共接口

针对CleanCore理念下的定制开发，推荐使用RAP框架开发，因此本节主要对框架内容简述。

下面是一些基础概念：

## CDS

CDS和以前区别并不大，值得说的有下面两点：

- 取值，对于特别复杂的取值，个人建议用注解 **@ObjectModel.query.implementedBy: 'ABAP:Class'** 写在继承接口 **if_rap_query_provider** 的类中
- 注解位置，以前注解直接写在Consume CDS中，现在会建议写在Metadata Extension中

## Behavior Definition

Behavior Definition基本是一键创建时就弄好了，然后基于标准生成的代码进行微调：

- 调整字段属性
- 新增保存时的附加操作，或重写保存时的托管操作

## EML

EML，Entity Manipulation Language，实体操作语言。

类比SQL修改数据库表，EML用于修改CDS。再搭配Behavior Definition，能表现出优秀的效果。

## 公共接口

SAP公共接口可以通过[Hub](https://hub.sap.com/)查询，以前以为只能在云上使用，然而并非如此，通过本地模拟调用，也能使用公共接口，也是主要推荐的功能实现方式

## RAP

Restful Application Programming，Cloud环境更多倾向于用RAP来开发
