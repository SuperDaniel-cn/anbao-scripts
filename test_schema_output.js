const { run } = require('./com.anbao.login/1.0.0/bundle');
const fs = require('fs').promises;
const path = require('path');

async function test() {
  const mockOutputDir = path.join(__dirname, 'test_output');
  const outputFileName = 'schema_test_output.json';
  const expectedOutputPath = path.join(mockOutputDir, outputFileName);

  // 模拟 context 对象
  const mockContext = {
    common: {
      output_directory: mockOutputDir,
      string_default: "测试短文本",
      string_textarea: "测试长文本\n多行",
      string_password: "test_password",
      string_date: "2025-10-09",
      string_date_time: "2025-10-09 15:30:00",
      string_enum: "选项B",
      number_field: 123.45,
      integer_field: 678,
      boolean_field: true,
      string_file: "/path/to/mock/file.txt",
      string_directory: "/path/to/mock/directory"
    },
    platform: { name: 'Mock Platform', base_url: 'http://mock.com' },
    profile: { name: 'Mock Profile' },
    paths: {
      downloads: path.join(__dirname, 'mock_downloads'),
      data: path.join(__dirname, 'mock_data'),
    },
    log: (message, level) => console.log(`[LOG - ${level || 'info'}] ${message}`),
    notify: (payload) => console.log(`[NOTIFY] ${payload.title}: ${payload.content}`),
    forceExit: (errorMessage) => {
      console.error(`[FORCE EXIT] ${errorMessage}`);
      process.exit(1);
    },
    requestHumanIntervention: async (options) => {
      console.log(`[HUMAN INTERVENTION] ${options.message}`);
      // 模拟用户点击“继续”
      return Promise.resolve();
    },
  };

  // 模拟 RunOptions
  const mockRunOptions = {
    browser: {}, // 模拟 Playwright BrowserContext
    page: {},    // 模拟 Playwright Page
    context: mockContext,
  };

  console.log('开始运行测试脚本...');
  await run(mockRunOptions);
  console.log('测试脚本运行完成。');

  // 检查输出文件
  try {
    const fileContent = await fs.readFile(expectedOutputPath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    console.log('输出文件内容:', parsedContent);

    // 简单验证
    if (JSON.stringify(parsedContent) === JSON.stringify(mockContext.common)) {
      console.log('输出文件内容与输入数据一致。测试通过！');
    } else {
      console.error('输出文件内容与输入数据不一致。测试失败！');
      process.exit(1);
    }
  } catch (error) {
    console.error(`检查输出文件失败: ${error.message}`);
    process.exit(1);
  } finally {
    // 清理模拟输出目录
    await fs.rm(mockOutputDir, { recursive: true, force: true });
    console.log(`已清理测试输出目录: ${mockOutputDir}`);
  }
}

test().catch(console.error);