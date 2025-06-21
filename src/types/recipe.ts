export interface Recipe {
  id: string;
  name: string;
  ingredients: [Ingredient] | undefined
  instructions: [Instruction] | undefined
}

export interface Ingredient {
  id: string;
  rawValue: string;
}

export interface Instruction {
    id: string;
    rawValue: string;
    index: number;
}