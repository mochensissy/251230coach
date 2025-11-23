#!/bin/bash

# 场景区分度快速验证脚本
# 用途：对比两个场景的系统提示词，验证差异性

echo "=================================="
echo "场景区分度快速验证"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 检查关键文件修改...${NC}"
echo ""

# 检查核心文件是否存在
if [ -f "src/lib/deepseek.ts" ]; then
    echo -e "${GREEN}✅ src/lib/deepseek.ts 文件存在${NC}"

    # 统计文件行数
    LINES=$(wc -l < "src/lib/deepseek.ts")
    echo "   文件总行数: ${LINES}"

    # 检查关键标记
    if grep -q "SCENARIO_QUESTION_BANK" "src/lib/deepseek.ts"; then
        echo -e "${GREEN}✅ SCENARIO_QUESTION_BANK 已添加${NC}"
    else
        echo -e "${YELLOW}⚠️  SCENARIO_QUESTION_BANK 未找到${NC}"
    fi

    if grep -q "沟通影响力类.*发言被忽视" "src/lib/deepseek.ts"; then
        echo -e "${GREEN}✅ 工作难题场景知识库已整合${NC}"
    else
        echo -e "${YELLOW}⚠️  工作难题场景知识库未找到${NC}"
    fi

    if grep -q "晋升瓶颈类.*表现优秀但未获晋升" "src/lib/deepseek.ts"; then
        echo -e "${GREEN}✅ 职业发展场景知识库已整合${NC}"
    else
        echo -e "${YELLOW}⚠️  职业发展场景知识库未找到${NC}"
    fi

    if grep -q "开场白指导（仅限第一次对话）" "src/lib/deepseek.ts"; then
        echo -e "${GREEN}✅ 开场白优化已完成${NC}"
    else
        echo -e "${YELLOW}⚠️  开场白优化未找到${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  src/lib/deepseek.ts 文件不存在${NC}"
fi

echo ""
echo -e "${BLUE}📁 检查文档文件...${NC}"
echo ""

if [ -f "SCENARIO_DIFF_ANALYSIS.md" ]; then
    echo -e "${GREEN}✅ SCENARIO_DIFF_ANALYSIS.md 已创建${NC}"
else
    echo -e "${YELLOW}⚠️  SCENARIO_DIFF_ANALYSIS.md 不存在${NC}"
fi

if [ -f "SCENARIO_OPTIMIZATION_REPORT.md" ]; then
    echo -e "${GREEN}✅ SCENARIO_OPTIMIZATION_REPORT.md 已创建${NC}"
else
    echo -e "${YELLOW}⚠️  SCENARIO_OPTIMIZATION_REPORT.md 不存在${NC}"
fi

echo ""
echo -e "${BLUE}🔍 统计场景专属问题数量...${NC}"
echo ""

if [ -f "src/lib/deepseek.ts" ]; then
    # 统计work_problem场景的问题数量
    WORK_QUESTIONS=$(grep -A 50 "work_problem: {" "src/lib/deepseek.ts" | grep '"' | wc -l)
    echo "   工作难题场景问题数: ~${WORK_QUESTIONS}"

    # 统计career_development场景的问题数量
    CAREER_QUESTIONS=$(grep -A 50 "career_development: {" "src/lib/deepseek.ts" | grep '"' | wc -l)
    echo "   职业发展场景问题数: ~${CAREER_QUESTIONS}"

    TOTAL_QUESTIONS=$((WORK_QUESTIONS + CAREER_QUESTIONS))
    echo "   总问题数: ~${TOTAL_QUESTIONS}"
fi

echo ""
echo -e "${BLUE}🎯 场景差异关键词检测...${NC}"
echo ""

echo "工作难题场景特征词:"
grep -o "24-48小时\|短期\|可控因素\|实用工具\|PREP原则\|时间四象限" "src/lib/deepseek.ts" | head -5 | sed 's/^/   - /'

echo ""
echo "职业发展场景特征词:"
grep -o "价值观\|内在动机\|长期愿景\|能力建设\|阶段性里程碑" "src/lib/deepseek.ts" | head -5 | sed 's/^/   - /'

echo ""
echo "=================================="
echo -e "${GREEN}验证完成！${NC}"
echo "=================================="
echo ""
echo "下一步："
echo "1. 访问 http://localhost:3001 测试开场白差异"
echo "2. 创建两个测试账号，分别选择不同场景"
echo "3. 查看 SCENARIO_DIFF_ANALYSIS.md 了解详细对比"
echo ""
