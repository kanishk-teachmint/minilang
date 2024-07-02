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
    let left = this.consume(['NUMBER', 'IDENTIFIER']).value;
    if (this.peek().type === 'OPERATOR') {
      const operator = this.consume('OPERATOR').value;
      const right = this.consume(['NUMBER', 'IDENTIFIER']).value;
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



class Interpreter {
  constructor(statements) {
    this.statements = statements;
    this.variables = {};
  }

  interpret() {
    for (let statement of this.statements) {
      this.execute(statement);
    }
  }

  execute(statement) {
    console.log('Executing Statement:', statement); // Debugging execution
    switch (statement.type) {
      case 'Assignment':
        this.variables[statement.identifier] = this.evaluate(statement.value);
        break;
      case 'Print':
        console.log(this.evaluate(statement.value));
        break;
      default:
        throw new Error(`Unknown statement type: ${statement.type}`);
    }
  }

  evaluate(expression) {
    if (typeof expression === 'string') {
      if (!isNaN(expression)) {
        return parseInt(expression);
      } else if (this.variables.hasOwnProperty(expression)) {
        return this.variables[expression];
      } else {
        throw new Error(`Undefined variable: ${expression}`);
      }
    } else if (expression.type === 'BinaryExpression') { //typeod expression is object
      const left = this.evaluate(expression.left);
      const right = this.evaluate(expression.right);
      switch (expression.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        default: throw new Error(`Unknown operator: ${expression.operator}`);
      }
    }
  }
}

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let input = '';

rl.question('Enter your custom code:\n', (answer) => {
  input = answer.trim();

  try {
    const tokenizer = new Tokenizer(input);
    const parser = new Parser(tokenizer.tokens);
    const statements = parser.parse();
    console.log('Statements:', statements); // Debugging AST
    const interpreter = new Interpreter(statements);
    interpreter.interpret();
  } catch (error) {
    console.error(error.message);
  } finally {
    rl.close();
  }
});
