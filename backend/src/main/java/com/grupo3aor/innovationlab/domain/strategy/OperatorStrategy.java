package com.grupo3aor.innovationlab.domain.strategy;

/**
 * Strategy pattern enum for evaluating clinical rule operators.
 * Encapsulates the logic for checking activation and resolution thresholds.
 */
public enum OperatorStrategy {
    GREATER_THAN(">") {
        @Override
        public boolean evaluateActivation(Double value, Double threshold) {
            return value.compareTo(threshold) > 0;
        }

        @Override
        public boolean evaluateResolution(Double value, Double threshold) {
            return value.compareTo(threshold) < 0;
        }
    },
    LESS_THAN("<") {
        @Override
        public boolean evaluateActivation(Double value, Double threshold) {
            return value.compareTo(threshold) < 0;
        }

        @Override
        public boolean evaluateResolution(Double value, Double threshold) {
            return value.compareTo(threshold) > 0;
        }
    },
    EQUALS("==") {
        @Override
        public boolean evaluateActivation(Double value, Double threshold) {
            return value.compareTo(threshold) == 0;
        }

        @Override
        public boolean evaluateResolution(Double value, Double threshold) {
            return value.compareTo(threshold) != 0;
        }
    };

    private final String symbol;

    OperatorStrategy(String symbol) {
        this.symbol = symbol;
    }

    public abstract boolean evaluateActivation(Double value, Double threshold);
    public abstract boolean evaluateResolution(Double value, Double threshold);

    public static OperatorStrategy fromSymbol(String symbol) {
        for (OperatorStrategy strategy : values()) {
            if (strategy.symbol.equals(symbol)) {
                return strategy;
            }
        }
        throw new IllegalArgumentException("Unknown operator: " + symbol);
    }
}
