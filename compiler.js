class Tokenizer {
    constructor(input) {
      this.input = input;
      this.position = 0;
      this.tokens = [];
      this.tokenize();
    }
  
    tokenize() {
      const tokenTypes = [
        { regex: /^\s+/, type: null }, // skip whitespace
        { regex: /^let\b/, type: 'LET' },
        { regex: /^print\b/, type: 'PRINT' },
        { regex: /^[a-zA-Z_]\w*/, type: 'IDENTIFIER' },
        { regex: /^[0-9]+/, type: 'NUMBER' },
        { regex: /^=/, type: 'EQUALS' },
        { regex: /^[+\-*/]/, type: 'OPERATOR' },
        { regex: /^;/, type: 'SEMICOLON' },
        { regex: /^\(/, type: 'LPAREN' },
        { regex: /^\)/, type: 'RPAREN' },
      ];
  
      while (this.position < this.input.length) {
        let match = null;
  
        for (let { regex, type } of tokenTypes) {
          const result = regex.exec(this.input.slice(this.position));
          if (result) {
            match = result[0];
            if (type) {
              this.tokens.push({ type, value: match });
            }
            break;
          }
        }
  
        if (!match) {
          throw new Error(`Unexpected token at position ${this.position}`);
        }
  
        this.position += match.length;
      }
    }
  }
  
  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.position = 0;
      this.symbolTable = {}; // For semantic analysis
    }
  
    parse() {
      const statements = [];
      while (this.position < this.tokens.length) {
        statements.push(this.parseStatement());
      }
      return statements;
    }
  
    parseStatement() {
      const token = this.peek();
      console.log('Parsing Statement:', token); // Debugging statement
      if (token.type === 'LET') {
        return this.parseAssignment();
      } else if (token.type === 'PRINT') {
        return this.parsePrint();
      } else {
        throw new Error(`Unexpected token: ${token.type}`);
      }
    }
  
    parseAssignment() {
      this.consume('LET');
      const identifier = this.consume('IDENTIFIER').value;
      this.consume('EQUALS');
      const value = this.parseExpression();
      this.consume('SEMICOLON');
  
      // Semantic analysis: register the variable in the symbol table
      if (this.symbolTable[identifier]) {
        throw new Error(`Variable ${identifier} already declared`);
      }
      this.symbolTable[identifier] = { type: 'variable', value };
  
      return { type: 'Assignment', identifier, value };
    }
  
    parsePrint() {
      this.consume('PRINT');
      this.consume('LPAREN');
      const value = this.parseExpression();
      this.consume('RPAREN');
      this.consume('SEMICOLON');
  
      return { type: 'Print', value };
    }
  
    parseExpression() {
      let left = this.consume(['NUMBER', 'IDENTIFIER']);
  
      // Semantic analysis: ensure identifiers are declared
      if (left.type === 'IDENTIFIER' && !this.symbolTable[left.value]) {
        throw new Error(`Variable ${left.value} not declared`);
      }
      
      left = left.value;
  
      if (this.peek().type === 'OPERATOR') {
        const operator = this.consume('OPERATOR').value;
        let right = this.consume(['NUMBER', 'IDENTIFIER']);
  
        // Semantic analysis: ensure identifiers are declared
        if (right.type === 'IDENTIFIER' && !this.symbolTable[right.value]) {
          throw new Error(`Variable ${right.value} not declared`);
        }
  
        right = right.value;
  
        return { type: 'BinaryExpression', left, operator, right };
      }
      return left;
    }
  
    peek() {
      return this.tokens[this.position];
    }
  
    consume(expectedTypes) {
      const token = this.tokens[this.position];
      console.log('Consuming:', token); // Debugging consume
      if (!Array.isArray(expectedTypes)) {
        expectedTypes = [expectedTypes];
      }
      if (!expectedTypes.includes(token.type)) {
        throw new Error(`Expected ${expectedTypes.join(' or ')}, got ${token.type}`);
      }
      this.position++;
      return token;
    }
  }





  class CodeGenerator {
    constructor(ast) {
      this.ast = ast;
    }
  
    generate() {
      let code = '';
      for (const node of this.ast) {
        code += this.generateStatement(node) + '\n';
      }
      return code;
    }
  
    generateStatement(node) {
      switch (node.type) {
        case 'Assignment':
          return this.generateAssignment(node);
        case 'Print':
          return this.generatePrint(node);
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }
    }
  
    generateAssignment(node) {
      const { identifier, value } = node;
      return `${this.generateExpression(value)}\nPUSH ${identifier}`;
    }
  
    generatePrint(node) {
      const { value } = node;
      return `${this.generateExpression(value)}\nPRINT`;
    }
  
    generateExpression(node) {
      if (typeof node === 'number') {
        return `PUSH ${node}`;
      }
      if (typeof node === 'string') {
        return `PUSH ${node}`;
      }
      if (node.type === 'BinaryExpression') {
        const { left, operator, right } = node;
        const op = this.operatorToInstruction(operator);
        return `${this.generateExpression(left)}\n${this.generateExpression(right)}\n${op}`;
      }
      throw new Error(`Unknown expression type: ${node.type}`);
    }
  
    operatorToInstruction(operator) {
      switch (operator) {
        case '+':
          return 'ADD';
        case '-':
          return 'SUB';
        case '*':
          return 'MUL';
        case '/':
          return 'DIV';
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    }
  }

  class Interpreter {
    constructor() {
      this.stack = [];
      this.variables = {};
    }
  
    execute(code) {
      const instructions = code.trim().split('\n');
      for (const instruction of instructions) {
        this.executeInstruction(instruction.trim());
      }
    }
  
    executeInstruction(instruction) {
      const [op, arg] = instruction.split(' ');
      switch (op) {
        case 'PUSH':
          if (isNaN(arg)) {
            this.stack.push(this.variables[arg]);
          } else {
            this.stack.push(Number(arg));
          }
          break;
        case 'POP':
          this.stack.pop();
          break;
        case 'ADD':
          this.stack.push(this.stack.pop() + this.stack.pop());
          break;
        case 'SUB':
          this.stack.push(-this.stack.pop() + this.stack.pop());
          break;
        case 'MUL':
          this.stack.push(this.stack.pop() * this.stack.pop());
          break;
        case 'DIV':
          this.stack.push(1 / this.stack.pop() * this.stack.pop());
          break;
        case 'PRINT':
          console.log(this.stack.pop());
          break;
        default:
          if (this.variables[op] !== undefined) {
            this.variables[op] = this.stack.pop();
          } else {
            throw new Error(`Unknown instruction: ${op}`);
          }
      }
    }
  }
  
  // Example usage:
  const input = `
    let x = 10;
    let y = 20;
    print(x + y);
  `;
  
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokens;
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  const codeGenerator = new CodeGenerator(ast);
  const generatedCode = codeGenerator.generate();
  
  console.log('Generated Assembly Code:');
  console.log(generatedCode);
  
  const interpreter = new Interpreter();
  console.log('Execution Output:');
  interpreter.execute(generatedCode);
  
  