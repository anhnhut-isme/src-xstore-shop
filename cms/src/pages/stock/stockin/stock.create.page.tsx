import {
  Form,
  Input,
  Col,
  Card,
  notification,
  Row,
  message,
  Button,
  Space,
  InputNumber,
  Divider,
  Typography,
  Select,
  Tag,
} from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'umi'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { createStockinService,  getAllColor, getAllSize } from '@/services/product.service'
import TextArea from 'antd/lib/input/TextArea'
import numeral from 'numeral'
import styles from './style.less'
import { flatten } from 'lodash'
const { Text } = Typography
const { Option } = Select

const labelStyle = {
  lineHeight: '37px',
}

const CreateStockin = props => {
  const { formatMessage } = useIntl()
  const { listProduct, handleCancel, exportFormValue } = props
  const [form] = Form.useForm()
  const FormItem = Form.Item
  const [shippingFee, setShippingFee] = useState(0)
  const [subTotal, setSubTotal] = useState(0)
  const [quantity, setQuantity] = useState([])
  const [unitPrice, setUnitPrice] = useState([])
  const [totalProduct, setTotalProduct] = useState([])
  const [listSize, setListSize] = useState([])
  const [listColor, setListColor] = useState([])
  const [selectProduct, setSelectProduct] = useState('')
  const [selectArrSize, setSelectArrSize] = useState([])
  const [selectSize, setSelectSize] = useState('')
  const [selectArrColor, setSelectArrColor] = useState([])

  useMemo(() => {
    const getList = async () => {
      const res1 = await getAllSize()
      const res2 = await getAllColor()
      setListSize(res1.data)
      setListColor(res2.data)
    }
    getList()
  },[])

  useMemo(() => {
    let tmpSize = []
    for (const i of listProduct) {
      for (const j of i?.infomations) {
        if(i.name === selectProduct){
          const data = listSize?.filter(item => item?.id === j.size.id)
          if(!tmpSize.includes(data[0]?.description)){
            tmpSize.push(data[0]?.description)
          }
        }
      }
    }
    setSelectArrSize(tmpSize)
  },[selectProduct])

  useMemo(() => {
    let tmpColor = []
    for (const i of listProduct) {
      for (const j of i?.infomations) {
        if(i.name === selectProduct){
          const data = listColor?.filter(item => item?.id === j.color.id)
          if(j.size.description === selectSize){
            tmpColor.push(j.color.description)
          }
        }
      }
    }
    setSelectArrColor(tmpColor)
  },[selectProduct,selectSize])
 
  

  const handleChangeName = (value) => {
    setSelectProduct(value)
  }

  const handleChangeSize = (value) => {
    setSelectSize(value)
  }

  const handleChangeQuantity = (value, index) => {
    const tempQuantity: any = [...quantity]
    tempQuantity[index] = value
    setQuantity(tempQuantity)
  }

  const handleChangeUnitPrice = (value, index) => {
    const tempUnitPrice: any = [...unitPrice]
    tempUnitPrice[index] = value
    setUnitPrice(tempUnitPrice)
  }

  const handleChangeShippingFee = value => {
    setShippingFee(value)
  }

  const multiplyTotalProduct = () => {
    const tempTotalProduct: any = [...totalProduct]
    if (quantity && quantity.length > 0 && unitPrice && unitPrice.length > 0) {
      for (var i = 0; i < quantity.length; i++) {
        tempTotalProduct[i] = quantity[i] * unitPrice[i]
      }
      setTotalProduct(tempTotalProduct)
    }
  }
  // tinh tong tien
  const calcSubtotal = () => {
    let sub = 0
    if (totalProduct && totalProduct.length > 0) {
      for (var i = 0; i < totalProduct.length; i++) {
        sub += totalProduct[i]
      }
      if (!totalProduct.includes(NaN)) {
        form.setFieldsValue({
          subTotal: sub,
        })
        setSubTotal(sub)
      }
    }
  }
  //tinh tong = tong tien + ship
  const calcGrandTotal = () => {
    if (typeof shippingFee === 'number' || typeof subTotal === 'number') {
      const grand = Number(shippingFee) + Number(subTotal)
      if (!isNaN(grand)) {
        form.setFieldsValue({
          grandTotal: grand,
        })
      } else {
        form.setFieldsValue({
          grandTotal: 0,
        })
      }
    }
  }

  const handleClose = () => {
    form.resetFields()
    setQuantity([])
    setUnitPrice([])
    setTotalProduct([])
    setSubTotal(0)
    setShippingFee(0)
    handleCancel()
  }

  // tao san pham
  const handleCreate = async res => {
    const arr = []
    const tempValue = res?.stockinProducts?.map((values, index) => {
      const newItem = listProduct?.find(i => i.name === values?.productName)
      const idItem = newItem?.infomations?.find(i => (i?.size?.description === values?.size && i?.color?.description === values?.color))
      const id = idItem?.id
      if(!arr.includes(id)){
        arr.push(id)
        return {
          productInfoId: id || 0,
          quantity: values.quantity,
          unitPrice: values.unitPrice,
          total: values.quantity * values.unitPrice,
      }
      }
    })
    const data = {
      stockinProducts: [...tempValue],
      // orderId: exportFormValue.id,
      message: res.message || '',
      subTotal: Number(res.subTotal),
      shippingPrice: (res.shippingPrice) || 0,
      grandTotal: Number(res.grandTotal),
    }
    const { success } = await createStockinService(data)
    if (success === true) {
      notification.success({
        icon: <CheckCircleOutlined style={{ color: 'green' }} />,
        message: formatMessage({ id: 'service.createSuccess' }),
      })
      form.resetFields()
      handleClose()
    } else {
      notification.success({
        icon: <CheckCircleOutlined style={{ color: 'red' }} />,
        message: formatMessage({ id: 'stockin.createFail' }),
      })
      form.resetFields()
      handleClose()
    }
  }

  const handleDeleteItem = value => {
    if (
      quantity.length > 1 &&
      unitPrice.length > 1 &&
      totalProduct.length > 1
    ) {
      // delete one item in array when click delete item
      const tempQuantity = [...quantity]
      tempQuantity.splice(value, 1)
      setQuantity(tempQuantity)

      const tempUnitPrice = [...unitPrice]
      tempUnitPrice.splice(value, 1)
      setUnitPrice(tempUnitPrice)

      const tempSubTotal = [...totalProduct]
      tempSubTotal.splice(value, 1)
      setTotalProduct(tempSubTotal)
    } else {
      // reset number fields when array product is empty
      form.resetFields(['subTotal', 'grandTotal', 'shippingPrice'])
      setQuantity([])
      setUnitPrice([])
      setTotalProduct([])
      setSubTotal(0)
      setShippingFee(0)
    }
  }

  useMemo(() => {
    multiplyTotalProduct()
  }, [quantity, unitPrice])

  useMemo(() => {
    calcSubtotal()
  }, [totalProduct])

  useMemo(() => {
    calcGrandTotal()
  }, [subTotal, shippingFee])

  return (
    <>
      <Form form={form} onFinish={handleCreate} size="large">
        <Row>
          <Col span={24}>
            <Form.List name="stockinProducts">
              {(fields, { add, remove }) => {
                return (
                  <div>
                    {fields.map((field, index) => (
                      <Space key={field.key} align="start">
                        <Form.Item
                          {...field}
                          style={{ width: '260px' }}
                          label={formatMessage({ id: 'stockin.name' })}
                          name={[field.name, 'productName']}
                          fieldKey={[field.fieldKey, 'productName']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          {/* <InputNumber
                              size="small"
                              placeholder={formatMessage({
                                id: 'stockin.productId',
                              })}
                              style={{ width: '100%' }}
                            /> */}

                          <Select
                            showSearch
                            size="small"
                            onChange={handleChangeName}
                            filterOption={(input, option) =>
                              option.children
                                .toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            }
                          >
                            {(listProduct || []).map(item => (
                              <Option key={item.id} value={item.name}>
                                {item.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...field}
                          style={{ width: '155px' }}
                          label={formatMessage({ id: 'stockin.size' })}
                          name={[field.name, 'size']}
                          fieldKey={[field.fieldKey, 'size']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          {/* <InputNumber
                              size="small"
                              placeholder={formatMessage({
                                id: 'stockin.productId',
                              })}
                              style={{ width: '100%' }}
                            /> */}

                          <Select 
                            size="small"
                            onChange={handleChangeSize}
                          >
                            {(selectArrSize || []).map((item, index) => (
                              <Select.Option
                                key={index}
                                value={item}
                             
                              >
                                {item}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...field}
                          style={{ width: '165px' }}
                          label={formatMessage({ id: 'stockin.color' })}
                          name={[field.name, 'color']}
                          fieldKey={[field.fieldKey, 'color']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          {/* <InputNumber
                              size="small"
                              placeholder={formatMessage({
                                id: 'stockin.productId',
                              })}
                              style={{ width: '100%' }}
                            /> */}

                          <Select size="small">
                            {selectArrColor?.map((item, index) => (
                              <Select.Option
                                key={index}
                                value={item}
                              >
                                {item}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        {/* <Form.Item
                          {...field}
                          label={formatMessage({ id: 'stockin.color' })}
                          style={{ width: '160px', textAlign: 'center' }}
                          name={[field.name, 'color']}
                          fieldKey={[field.fieldKey, 'color']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          <Input size="small" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label={formatMessage({ id: 'stockin.size' })}
                          style={{ width: '160px', textAlign: 'center' }}
                          name={[field.name, 'size']}
                          fieldKey={[field.fieldKey, 'size']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          <Input size="small" />
                        </Form.Item> */}
                        <Form.Item
                          {...field}
                          label={formatMessage({ id: 'stockin.totalQuantity' })}
                          style={{ width: '160px', textAlign: 'center' }}
                          name={[field.name, 'quantity']}
                          fieldKey={[field.fieldKey, 'quantity']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%', textAlign: 'center' }}
                            onChange={evt => handleChangeQuantity(evt, index)}
                            size="small"
                            placeholder={formatMessage({
                              id: 'stockin.productQuantity',
                            })}
                          />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label={formatMessage({ id: 'stockin.unitPrice' })}
                          name={[field.name, 'unitPrice']}
                          fieldKey={[field.fieldKey, 'unitPrice']}
                          rules={[
                            {
                              required: true,
                              message: formatMessage({
                                id: 'stockin.required',
                              }),
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            size="small"
                            onChange={evt => handleChangeUnitPrice(evt, index)}
                            placeholder={formatMessage({
                              id: 'stockin.unitPrice',
                            })}
                            style={{ width: '100%' }}
                            formatter={value =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                        <Form.Item {...field}>
                          <Button
                            danger
                            size="small"
                            type="link"
                            onClick={() => {
                              remove(field.name)
                              handleDeleteItem(index)
                            }}
                            icon={<DeleteOutlined />}
                          ></Button>
                        </Form.Item>
                      </Space>
                    ))}
                    <Form.Item>
                      <Button
                        size="small"
                        type="dashed"
                        onClick={() => {
                          add()
                        }}
                        block
                      >
                        <PlusOutlined />{' '}
                        {formatMessage({ id: 'stockin.addProduct' })}
                      </Button>
                    </Form.Item>
                  </div>
                )
              }}
            </Form.List>
          </Col>
          <Col span={24}>
            <Row>
              <Col span={10}>
                {/* Order Id */}
                {/* <FormItem
                  label={
                    <strong>{formatMessage({ id: 'stockin.orderId' })}</strong>
                  }
                  name="orderId"
                  // rules={[
                  //   {
                  //     required: true,
                  //     message: formatMessage({ id: 'stockin.required' }),
                  //   },
                  // ]}
                >
                  <Tag
                    color="blue"
                    style={{ fontSize: '14px', fontWeight: 'bold' }}
                  >
                    #{exportFormValue?.id}
                  </Tag>
                </FormItem> */}

                {/* Message */}
                <FormItem
                  style={{ width: '100%' }}
                  label={formatMessage({ id: 'stockin.message' })}
                  name="message"
                  rules={[
                    {
                      required: true,
                      message: formatMessage({ id: 'stockin.required' }),
                    },
                  ]}
                >
                  <TextArea
                    style={{ width: '100%', marginTop: '4px' }}
                    rows={3}
                    maxLength={100}
                    showCount
                  />
                </FormItem>
              </Col>
              <Col span={14}>
                {/* //Shiping Price */}
                <Row>
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={10}
                  >
                    <Text style={labelStyle}>
                      {formatMessage({ id: 'stockin.shippingPrice' })}:
                    </Text>
                  </Col>
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={14}
                  >
                    <FormItem
                      style={{ width: '160px' }}
                      name="shippingPrice"
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '160px' }}
                        defaultValue={shippingFee}
                        size="small"
                        formatter={value =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        //addonAfter="vnd"
                        onChange={e => handleChangeShippingFee(e)}
                      />
                    </FormItem>
                  </Col>
                </Row>
                {/* //Subtotal */}
                <Row>
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={10}
                  >
                    <Text style={labelStyle}>
                      {formatMessage({ id: 'stockin.subTotal' })}:
                    </Text>
                  </Col>
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={14}
                  >
                    <FormItem
                      style={{ width: '160px' }}
                      name="subTotal"
                      rules={[
                        {
                          required: true,
                          message: formatMessage({ id: 'stockin.required' }),
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        defaultValue={subTotal}
                        style={{ width: '160px' }}
                        formatter={value =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        size="small"
                      // addonAfter="vnd"
                      />
                    </FormItem>
                  </Col>
                </Row>
                {/* //grandTotal*/}
                <Row justify="end">
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={10}
                  >
                    <Text style={labelStyle}>
                      {formatMessage({ id: 'stockin.grandTotal' })}:
                    </Text>
                  </Col>
                  <Col
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    span={14}
                  >
                    <FormItem
                      style={{ width: '160px' }}
                      name="grandTotal"
                      rules={[
                        {
                          required: true,
                          message: formatMessage({ id: 'stockin.required' }),
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        defaultValue={0}
                        style={{ width: '160px' }}
                        formatter={value =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        size="small"
                      // addonAfter="vnd"
                      />
                    </FormItem>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
        </Row>
        <Divider style={{ margin: '12px 0' }} />
        <div className={styles.button_view}>
          <FormItem>
            <Button size="small" onClick={handleClose}>
              {formatMessage({ id: 'account.cancelBtn' })}
            </Button>
          </FormItem>
          <FormItem>
            <Button
              style={{ marginLeft: '8px' }}
              size="small"
              type="primary"
              htmlType="submit"
            >
              {' '}
              {formatMessage({ id: 'stockin.create' })}{' '}
            </Button>
          </FormItem>
        </div>
      </Form>
    </>
  )
}
export default CreateStockin
