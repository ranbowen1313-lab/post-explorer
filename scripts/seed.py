#!/usr/bin/env python3
"""初始化测试数据：注册 2 个测试账号，导入 2 份虚构简历 + 2 份岗位描述。

用法：
    python scripts/seed.py [base_url]

默认 base_url 为 http://localhost:8080（后端已启动）。
脚本幂等：账号/材料已存在则跳过，可重复运行。
"""

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'


def request(method, path, token=None, body=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode('utf-8')
        return json.loads(raw) if raw else None


def register_or_login(email, password, name):
    try:
        request('POST', '/api/auth/register', body={'email': email, 'password': password, 'name': name})
        print(f'  已注册 {email}')
    except urllib.error.HTTPError as e:
        if e.code == 409:
            print(f'  {email} 已存在，跳过注册')
        else:
            raise
    return request('POST', '/api/auth/login', body={'email': email, 'password': password})['token']


RESUME_1 = """# 张伟

**求职意向**：Java 后端开发工程师
**电话**：138-0000-0001
**邮箱**：zhangwei@example.com

## 教育背景
- 2020.09 - 2024.06 | 某大学 | 计算机科学与技术 | 本科

## 工作经历
### 某科技公司 | Java 后端工程师 | 2024.07 - 至今
- 负责订单系统的后端开发，使用 Spring Boot + MySQL
- 参与接口性能优化

## 项目经历
### 电商订单系统 | 后端开发 | 2024.01 - 2024.06
- 项目简介：面向中小商家的订单管理系统
- 个人职责：负责订单模块与支付回调模块的开发，使用 Spring Boot、MySQL、Redis 缓存

## 专业技能
- Java、Spring Boot、MySQL、Redis、Git

## 证书与语言
- CET-6"""

JOB_1 = """岗位职责：
1. 负责后端服务的设计与开发
2. 参与系统性能优化

任职要求：
1. 熟悉 Java、Spring Boot、MySQL
2. 熟悉 Redis 缓存
3. 有分布式或微服务经验优先
4. 有 Kafka 或消息队列经验优先"""

RESUME_2 = """# 李娜

**求职意向**：前端开发工程师
**电话**：139-0000-0002
**邮箱**：lina@example.com

## 教育背景
- 2021.09 - 2025.06 | 某大学 | 软件工程 | 本科

## 项目经历
### 校园二手交易平台 | 前端开发 | 2023.06 - 2023.09
- 项目简介：面向在校学生的二手物品交易小程序
- 个人职责：负责页面开发，使用 React，实现商品列表与详情页

## 专业技能
- JavaScript、React、HTML/CSS

## 证书与语言
- CET-4"""

JOB_2 = """岗位职责：
1. 负责 Web 前端页面的开发与维护

任职要求：
1. 熟悉 JavaScript、React
2. 熟悉 Vue 框架
3. 有移动端开发经验优先
4. 有 TypeScript 经验优先"""


def main():
    print('初始化测试数据（幂等，可重复运行）...')

    print('1. 注册测试账号')
    t1 = register_or_login('candidate1@test.com', 'pass123456', '张伟')
    t2 = register_or_login('candidate2@test.com', 'pass123456', '李娜')

    print('2. candidate1：简历 + 岗位（较匹配组合）')
    if not request('GET', '/api/resumes', t1):
        request('POST', '/api/resumes', t1, {'title': '张伟-后端开发', 'content': RESUME_1})
        print('  已导入简历「张伟-后端开发」')
    else:
        print('  简历已存在，跳过')
    if not request('GET', '/api/jobs', t1):
        request('POST', '/api/jobs', t1, {'title': 'Java 后端开发工程师', 'description': JOB_1})
        print('  已导入岗位「Java 后端开发工程师」')
    else:
        print('  岗位已存在，跳过')

    print('3. candidate2：简历 + 岗位（信息缺口组合）')
    if not request('GET', '/api/resumes', t2):
        request('POST', '/api/resumes', t2, {'title': '李娜-前端开发', 'content': RESUME_2})
        print('  已导入简历「李娜-前端开发」')
    else:
        print('  简历已存在，跳过')
    if not request('GET', '/api/jobs', t2):
        request('POST', '/api/jobs', t2, {'title': '前端开发工程师', 'description': JOB_2})
        print('  已导入岗位「前端开发工程师」')
    else:
        print('  岗位已存在，跳过')

    print()
    print('完成。测试账号：')
    print('  candidate1@test.com / pass123456（张伟，较匹配组合）')
    print('  candidate2@test.com / pass123456（李娜，信息缺口组合）')
    print('提示：登录后需在右上角「设置 API Key」配置你的真实 DeepSeek key（内存态，每次登录重配）。')


if __name__ == '__main__':
    main()
