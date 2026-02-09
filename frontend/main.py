import os

def generate_nuxt4_docs():
    # 1. 路径定义
    output_dir = "src"
    output_file = os.path.join(output_dir, "nuxt4_full_context.md")
    root_readme = "README.md"
    
    # 2. Nuxt 4 专属排除名单 (过滤掉体积庞大或无关的目录)
    ignored_dirs = {
        '.git', 'node_modules', '.nuxt', '.output', 
        'dist', 'public', 'assets', 'coverage', '.github'
    }
    
    # 我们感兴趣的文件后缀
    target_extensions = {'.vue', '.ts', '.js', '.json'}
    # 忽略大型锁文件和无关配置
    ignored_files = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.gitignore'}

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    all_content = [
        "# Nuxt 4 项目代码全景图\n",
        "> 此文档包含 `app/` 目录前端逻辑、`server/` 目录后端逻辑及全局配置。\n",
        "---"
    ]

    # 3. 递归扫描
    for root, dirs, files in os.walk("."):
        # 排除忽略目录
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in target_extensions) and file not in ignored_files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, ".")
                
                # 为不同文件类型分配合适的 Markdown 语法高亮
                ext = file.split('.')[-1]
                lang_map = {
                    'vue': 'html',
                    'json': 'json',
                    'ts': 'typescript',
                    'js': 'javascript'
                }
                lang = lang_map.get(ext, 'text')

                all_content.append(f"### 📂 File: `{rel_path}`")
                all_content.append(f"```{lang}")
                
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        all_content.append(f.read())
                except Exception as e:
                    all_content.append(f"// [Error] 无法读取文件: {e}")
                
                all_content.append("```\n")

    # 4. 生成代码汇总文件
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(all_content))

    # 5. 生成根目录 README.md 并附带 Nuxt 4 目录结构参考
    with open(root_readme, "w", encoding="utf-8") as f:
        f.write("# Nuxt 4 项目上下文\n\n")
        f.write("此文件用于快速引导 Gemini 了解项目：\n\n")
        f.write("* **核心前端代码**: 位于 `app/` 目录。\n")
        f.write("* **核心后端代码**: 位于 `server/` 目录。\n")
        f.write(f"* **完整代码汇总**: [点击查看代码详情]({output_file})\n\n")
        f.write("## 快速提示\n")
        f.write("如果你将此项目发给 AI，请让它关注 `nuxt.config.ts` 中的 `future: { compatibilityVersion: 4 }` 配置。")

    print(f"🔥 Nuxt 4 适配版处理完毕！")
    print(f"📍 汇总代码: {output_file}")
    print(f"📍 项目引导: {root_readme}")

if __name__ == "__main__":
    generate_nuxt4_docs()
