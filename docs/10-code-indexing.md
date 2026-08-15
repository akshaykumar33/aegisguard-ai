# Code Indexing & AST Symbol Extraction

## Tree-Sitter AST Indexing

CodeGuard indexes entire repositories into structured Abstract Syntax Trees (AST) to provide architectural grounding for code reviews.

### Supported Language Grammars
- TypeScript / JavaScript (`tree-sitter-typescript`)
- Python (`tree-sitter-python`)
- Go (`tree-sitter-go`)
- Rust, Java, C#

### Extracted Symbol Entities
Every code file is decomposed into:
- `FunctionDeclaration` & `MethodDefinition` (parameters, return types, start/end lines)
- `ClassDeclaration` & `InterfaceDeclaration` (inheritance, implemented interfaces)
- `ImportDeclaration` & `ExportDeclaration` (module dependencies)
- `VariableDeclaration` & `ConstantDeclaration`
