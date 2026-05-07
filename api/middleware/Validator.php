<?php
/**
 * ✅ VALIDATOR - Validate input data
 */

class Validator {
    
    private $errors = [];
    private $data = [];
    
    public function __construct($data = []) {
        $this->data = $data;
    }
    
    /**
     * Validate required field
     */
    public function required($field, $message = null) {
        if (empty($this->data[$field])) {
            $this->addError($field, $message ?? "$field is required");
        }
        return $this;
    }
    
    /**
     * Validate email
     */
    public function email($field, $message = null) {
        if (!empty($this->data[$field])) {
            if (!validateEmail($this->data[$field])) {
                $this->addError($field, $message ?? "$field must be valid email");
            }
        }
        return $this;
    }
    
    /**
     * Validate phone
     */
    public function phone($field, $message = null) {
        if (!empty($this->data[$field])) {
            if (!validatePhone($this->data[$field])) {
                $this->addError($field, $message ?? "$field must be valid phone");
            }
        }
        return $this;
    }
    
    /**
     * Validate minimum length
     */
    public function min($field, $length, $message = null) {
        if (!empty($this->data[$field])) {
            if (strlen($this->data[$field]) < $length) {
                $this->addError($field, $message ?? "$field must be at least $length characters");
            }
        }
        return $this;
    }
    
    /**
     * Validate maximum length
     */
    public function max($field, $length, $message = null) {
        if (!empty($this->data[$field])) {
            if (strlen($this->data[$field]) > $length) {
                $this->addError($field, $message ?? "$field must not exceed $length characters");
            }
        }
        return $this;
    }
    
    /**
     * Validate numeric
     */
    public function numeric($field, $message = null) {
        if (!empty($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->addError($field, $message ?? "$field must be numeric");
            }
        }
        return $this;
    }
    
    /**
     * Validate integer
     */
    public function integer($field, $message = null) {
        if (!empty($this->data[$field])) {
            if (!is_int($this->data[$field]) && !ctype_digit($this->data[$field])) {
                $this->addError($field, $message ?? "$field must be integer");
            }
        }
        return $this;
    }
    
    /**
     * Validate in array
     */
    public function in($field, $values, $message = null) {
        if (!empty($this->data[$field])) {
            if (!in_array($this->data[$field], $values)) {
                $this->addError($field, $message ?? "$field is invalid");
            }
        }
        return $this;
    }
    
    /**
     * Validate array
     */
    public function isArray($field, $message = null) {
        if (isset($this->data[$field])) {
            if (!is_array($this->data[$field])) {
                $this->addError($field, $message ?? "$field must be array");
            }
        }
        return $this;
    }
    
    /**
     * Add custom error
     */
    private function addError($field, $message) {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }
    
    /**
     * Check if validation failed
     */
    public function fails() {
        return !empty($this->errors);
    }
    
    /**
     * Get errors
     */
    public function errors() {
        return $this->errors;
    }
    
    /**
     * Get first error message
     */
    public function firstError() {
        foreach ($this->errors as $field => $messages) {
            return $messages[0];
        }
        return null;
    }
}

?>
