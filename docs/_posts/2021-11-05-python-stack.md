---
layout: post
title: Data Structures - Stack in Python
categories:
    - python
author:
- Teo Parashkevov
meta: [data structures, python]
usemathjax: true
thumbnail_location: stack-python
description: Stack as a data structure in Python. 
---

```python
from random import randint
import sys
import numpy as np
import time 
import pandas as pd
```

# Stack

---


## Definition

A stack is a linear data structure characterized by its LIFO (Last In, First Out) principle. It is an ordered collection of elements where the addition and removal of elements occur only at one end, known as the top of the stack. The stack follows a strict policy of element insertion and removal through its top, implying that the last element added to the stack is the first to be removed. This structure can be implemented as an abstract data type that provides operations to manipulate its contents.

## Usage

Stacks find extensive usage across various domains due to their efficiency and simplicity. They are commonly utilized for solving problems involving reversing or undoing operations. The stack data structure is integral in parsing expressions, implementing recursive algorithms, evaluating postfix expressions, and backtracking through recursive depth-first search algorithms. Furthermore, stacks are fundamental in the implementation of run-time call stacks in programming languages, enabling function calls and their respective return addresses to be stored and managed efficiently. The versatility and utility of the stack data structure make it a fundamental component in algorithm design and analysis.


## Sequential stack

---

### Definition

A sequential stack, also known as an array-based stack, is a type of stack implementation that uses an underlying array to store its elements. It maintains a fixed-size array where elements are added and removed from one end, typically the top of the stack. Sequential stacks provide efficient random access to elements and support constant-time insertion and deletion operations. However, the size of a sequential stack is fixed, meaning it cannot dynamically resize to accommodate varying numbers of elements.


### Advantages of sequential stacks

- <span style="color: rgb(229, 235, 73);"> __Efficient random access__ </span>: Sequential stacks provide efficient random access to elements due to the underlying array representation.
- <span style="color: rgb(229, 235, 73);"> __Constant-time operations__ </span>: Insertion and deletion operations in sequential stacks have a constant time complexity, making them efficient.
- <span style="color: rgb(229, 235, 73);"> __Space efficiency__ </span>: Sequential stacks have efficient memory utilization as they only require storage for the elements themselves and the fixed-size array.



### Disadvantages of sequential stacks

- <span style="color: rgb(229, 235, 73);"> __Fixed size__ </span>: Sequential stacks have a fixed size determined during initialization, which means they cannot dynamically resize to accommodate varying numbers of elements. This limitation can lead to stack overflow or underflow if the number of elements exceeds the capacity or if the stack becomes empty.
- <span style="color: rgb(229, 235, 73);"> __Inefficient resizing__ </span>: Resizing a sequential stack requires creating a new larger array and copying all elements, resulting in additional time complexity and potential memory allocation issues.
- <span style="color: rgb(229, 235, 73);"> __Wasteful memory usage__ </span>: If the stack does not utilize its entire capacity, the memory allocated for the unused portion of the array is wasted.
- <span style="color: rgb(229, 235, 73);"> __Limited scalability__ </span>: Due to the fixed-size nature, sequential stacks may not be suitable for applications with unpredictable or varying numbers of elements, as they require upfront determination of the maximum capacity.

### Advantages

- <span style="color: rgb(97, 68, 242);"> __Efficient random access__ </span>
- <span style="color: rgb(97, 68, 242);"> __Constant-time operations__ </span>
- <span style="color: rgb(97, 68, 242);"> __Space efficiency__ </span>


### Disadvantages

- <span style="color: rgb(245, 66, 81);"> __Fixed size__ </span>
- <span style="color: rgb(245, 66, 81);"> __Inefficient resizing__ </span>
- <span style="color: rgb(245, 66, 81);"> __Wasteful memory usage__ </span>
- <span style="color: rgb(245, 66, 81);"> __Limited scalability__ </span>

_In python lists and some other data structures grow and shrink dynamically. Which means that, strictly speaking, the implementation of the sequential stack is not achievable with a list. Mainly, because Python will always give free space for the next element in the stack. In order to go around this "flaw", we will implement a custom function in our SequentialStack class that will tell us when we have reach the theoretical max_size set when the stack gets initialized._

### SequentialStack Class Description

The `SequentialStack` class implements a stack data structure using a Python list with the following functionalities:

#### Initialization
- `__init__(max_size:int)`: Initializes the stack with a specified maximum size.
    - `data`: Empty list to store elements.
    - `max_size`: Maximum capacity of the stack.
    - `top_idx`: Index pointer for the top element (-1 when empty).
    - `bottom_idx`: Index pointer for the bottom element (0 when empty).

#### Magic Methods
- `__len__()`: Returns the current length (number of elements) of the stack.
- `__str__()`: Provides a string representation of the stack, highlighting top and bottom elements.

#### Private Method
- `__reached_max_size()`: Checks if the stack has reached its maximum capacity.

#### Stack Operations
- `push(element)`: Adds an element to the top of the stack if capacity allows.
- `pop()`: Removes and returns the top element from the stack.

Both operations handle underflow (popping an empty stack) or overflow (pushing when the stack is at max capacity) and raise exceptions accordingly.

#### Properties
- `size`: Returns the current size (number of elements) in the stack.
- `is_empty`: Checks if the stack is empty.
- `top`: Returns the index of the top element.
- `bottom`: Returns the index of the bottom element.

This stack follows the Last In, First Out (LIFO) principle, enabling basic stack operations while maintaining track of size, emptiness, and positions of top and bottom elements.



```python
class SequentialStack():

    def __init__(self, max_size:int):
        self.data       = ['' for i in range(max_size)]
        self.max_size   = max_size
        self.top_idx    = -1
        self.bottom_idx = 0

    def __len__(self):
        return len(self.data)

    def __str__(self):
        output = list()

        if self.top_idx == -1:
            return '[]'
        
        for idx, elmt in enumerate(self.data):
            if self.top_idx == idx and self.bottom_idx == idx:
                output.append( '[' + str(elmt) + ']' + ' <- top/bottom')
                continue
            elif self.top_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- top')
            elif self.bottom_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- bottom')
            else:
                output.append('[' + str(elmt) + ']')
                
        output = '\n'.join(output[::-1])
        return output

    def __reached_max_size(self):
        ''' We implement this function in order to cope with Pythons dynamic variable growth ''' 
        return True if self.top_idx == (self.max_size - 1) else False

    def push(self, element):
        if not self.__reached_max_size():
            # self.data.append(element)
            self.data[self.top_idx + 1] = element
            self.top_idx += 1
        else:
            raise Exception('Stack overflow')

    def pop(self):
        if not self.is_empty:
            element = self.data.pop()
            self.top_idx -= 1
            return element
        else:
            raise Exception('Stack is empty')

    @property
    def size(self):
        return len(self.data)

    @property
    def is_empty(self):
        # return True if self.size == 0 else False
        return True if self.top_idx == -1 else False

    @property
    def top(self):
        return self.top_idx

    @property
    def bottom(self):
        return self.bottom_idx

    @property
    def top_element(self):
        return self.data[self.top_idx] if self.top_idx >= 0 else None

    @property
    def bottom_element(self):
        return self.data[self.bottom_idx]
```


```python
seq_stack_max_size = 10
seq_stack = SequentialStack(seq_stack_max_size)

```


```python
pushed_sequence_squential_stack = list()
for i in range(seq_stack_max_size):
    tmp_element = randint(10, 100)
    seq_stack.push(tmp_element)
    pushed_sequence_squential_stack.append(tmp_element)

print('Number of elements pushed: ', len(pushed_sequence_squential_stack))
print('Pushed sequendce => ', pushed_sequence_squential_stack, '\n')
print(seq_stack)
print()
```

    Number of elements pushed:  10
    Pushed sequendce =>  [87, 41, 88, 29, 65, 69, 74, 44, 100, 19] 
    
    [19] <- top
    [100]
    [44]
    [74]
    [69]
    [65]
    [29]
    [88]
    [41]
    [87] <- bottom
    



```python
popped_sequence_sequential_stack = [seq_stack.pop()for i in range(seq_stack_max_size - randint(2, seq_stack_max_size - 2))]
print('Number of elements popped: ', len(popped_sequence_sequential_stack))
print('Popped sequendce => ', popped_sequence_sequential_stack, '\n')
print(seq_stack)
print()
```

    Number of elements popped:  8
    Popped sequendce =>  [19, 100, 44, 74, 69, 65, 29, 88] 
    
    [41] <- top
    [87] <- bottom
    


## Linked stack

---

### Definition 

A linked stack, also referred to as a linked list-based stack, is a type of stack implementation that uses a linked list to store its elements. It is composed of nodes where each node contains an element and a reference to the next node. The top of the stack is represented by the first node in the linked list. Linked stacks provide flexibility in terms of size as they can dynamically grow or shrink to accommodate elements. Insertion and deletion operations are efficient, requiring only the manipulation of the linked list's pointers. Linked stacks allow for efficient memory utilization, but they may incur additional overhead due to the storage of node references.

### Advantages of Linked Stack:

- <span style="color: rgb(229, 235, 73);"> __Dynamic size__ </span>: Linked stack allows for a dynamic size, as elements can be added or removed easily without any need for resizing or shifting of elements.
- <span style="color: rgb(229, 235, 73);"> __Efficient memory utilization__ </span>: Linked stack optimizes memory utilization as it only allocates memory for the elements actually stored in the stack, unlike an array-based stack which requires a fixed size allocation.
- <span style="color: rgb(229, 235, 73);"> __Ease of implementation__ </span>: Implementing a linked stack is relatively straightforward, requiring minimal coding and no need for complex resizing strategies.
- <span style="color: rgb(229, 235, 73);"> __Flexibility__ </span>: Linked stack allows for easy implementation of additional operations such as copying or merging stacks, which can be useful in various applications.




### Disadvantages of Linked Stack:

- <span style="color: rgb(229, 235, 73);"> __Overhead of pointers__ </span>: Each element in a linked stack requires additional memory space for storing pointers, which can result in increased overhead when compared to an array-based stack.
- <span style="color: rgb(229, 235, 73);"> __Slower access times__ </span>: Accessing an element in a linked stack requires traversing through the nodes, leading to slower access times compared to direct indexing in an array-based stack.
- <span style="color: rgb(229, 235, 73);"> __Extra memory overhead__ </span>: Linked stack utilizes additional memory to store the pointers, which can result in higher memory overhead compared to the actual data being stored.
- <span style="color: rgb(229, 235, 73);"> __Potential for memory fragmentation__ </span>: If elements are frequently added and removed from a linked stack, it can lead to memory fragmentation over time, which may cause inefficient memory usage.

### Advantages

- <span style="color: rgb(97, 68, 242);"> __Dynamic size__ </span>
- <span style="color: rgb(97, 68, 242);"> __Efficient memory utilization__ </span>
- <span style="color: rgb(97, 68, 242);"> __Ease of implementation__ </span>
- <span style="color: rgb(97, 68, 242);"> __Flexibility__ </span>

### Disadvantages

- <span style="color: rgb(245, 66, 81);">  __Overhead of pointers__ </span>
- <span style="color: rgb(245, 66, 81);">  __Slower access times__ </span>
- <span style="color: rgb(245, 66, 81);">  __Extra memory overhead__ </span>
- <span style="color: rgb(245, 66, 81);">  __Potential for memory fragmentation__ </span>



### LinkedStack Class Description

The `LinkedStack` class implements a stack data structure using a Python list with the following functionalities:

#### Initialization
- `__init__()`: Initializes the stack.
    - `data`: Empty list to store elements.
    - `top_idx`: Index pointer for the top element (-1 when empty).
    - `bottom_idx`: Index pointer for the bottom element (0 when empty).

#### Magic Methods
- `__len__()`: Returns the current length (number of elements) of the stack.
- `__str__()`: Provides a string representation of the stack, highlighting top and bottom elements.

#### Stack Operations
- `push(element)`: Adds an element to the top of the stack.
- `pop()`: Removes and returns the top element from the stack.

Both operations handle underflow (popping an empty stack) and update the top index accordingly.

#### Properties
- `size`: Returns the current size (number of elements) in the stack.
- `is_empty`: Checks if the stack is empty.
- `top`: Returns the index of the top element.
- `bottom`: Returns the index of the bottom element.

This stack follows the Last In, First Out (LIFO) principle, enabling basic stack operations such as pushing, popping, and tracking the size and emptiness of the stack.



```python
class Node():
    def __init__(self, data):
        self.data = data
        self.next_node = None

    def __iter__(self):
        tmp_node = self
        return_iterable = list()
        while tmp_node is not None:
            return_iterable.append(tmp_node)
            tmp_node = tmp_node.next_node
            
        return iter(return_iterable)            

    def __str__(self):
        return str(self.data)

    def __len__(self):
        counter = 1
        tmp_node = self
        while tmp_node.next_node is not None:
            counter += 1
            tmp_node = tmp_node.next_node
        
        return counter

class LinkedNodeStack():

    def __init__(self):
        self.data       = None
        self.top_idx    = -1
        self.bottom_idx = 0

    def __len__(self):
        return 0 if self.data is None else len(self.data)

    def __str__(self):
        output = list()

        if self.top_idx == -1:
            return '[]'
            
        for idx, elmt in enumerate(self.data):
            if self.top_idx == idx and self.bottom_idx == idx:
                output.append( '[' + str(elmt) + ']' + ' <- top/bottom')
                continue
            elif self.top_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- top')
            elif self.bottom_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- bottom')
            else:
                output.append('[' + str(elmt) + ']')

        output = '\n'.join(output[::-1])
        return output

    def push(self, element):
        if self.data is None:
            self.data = Node(element)
            self.top_idx += 1
            return 
        
        tmp_node = Node(element)
        last_node = self.data
        for i in range(self.top):
            last_node = last_node.next_node
            
        last_node.next_node = tmp_node
        self.top_idx += 1

    def pop(self):
        if self.data is not None:
            tmp_node  = self.data
            prev_node = None
            while tmp_node.next_node is not None:
                prev_node = tmp_node
                tmp_node  = tmp_node.next_node

            if prev_node is not None:
                prev_node.next_node = None
                self.top_idx -= 1
            else:
                self.data = None

            return tmp_node
        else:
            raise Exception('Stack is empty')

    @property
    def size(self):
        return self.__len__()

    @property
    def is_empty(self):
        # return True if self.size == 0 else False
        return True if self.top_idx == -1 else False

    @property
    def top(self):
        return self.top_idx

    @property
    def bottom(self):
        return self.bottom_idx

    @property
    def top_element(self):
        tmp_node  = self.data
        while tmp_node.next_node is not None:
            tmp_node  = tmp_node.next_node     
        return tmp_node

    @property
    def bottom_element(self):
        return self.data
```


```python
linked_node_stack = LinkedNodeStack()
linked_node_stack.push(55)
linked_node_stack.push(6)
linked_node_stack.push(7)
linked_node_stack.push(8)
linked_node_stack.push(9)
linked_node_stack.push(10)
linked_node_stack.push(11)

print("The size of the stack is => ", len(linked_node_stack), '\n')
print(linked_node_stack)

```

    The size of the stack is =>  7 
    
    [11] <- top
    [10]
    [9]
    [8]
    [7]
    [6]
    [55] <- bottom



```python
popped_element = linked_node_stack.pop()

print("The size of the stack is => ", len(linked_node_stack))
print("Popped element => ", popped_element, '\n')
print(linked_node_stack)
```

    The size of the stack is =>  6
    Popped element =>  11 
    
    [10] <- top
    [9]
    [8]
    [7]
    [6]
    [55] <- bottom



```python
class LinkedStack():

    def __init__(self):
        self.data       = list()
        self.top_idx    = -1
        self.bottom_idx = 0

    def __len__(self):
        return len(self.data)

    def __str__(self):
        output = list()

        if self.top_idx == -1:
            return '[]'
        
        for idx, elmt in enumerate(self.data):
            if self.top_idx == idx and self.bottom_idx == idx:
                output.append( '[' + str(elmt) + ']' + ' <- top/bottom')
                continue
            elif self.top_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- top')
            elif self.bottom_idx == idx:
                output.append('[' + str(elmt) + ']' + ' <- bottom')
            else:
                output.append('[' + str(elmt) + ']')

        output = '\n'.join(output[::-1])
        return output

    def push(self, element):
        self.data.append(element)
        self.top_idx += 1

    def pop(self):
        if not self.is_empty:
            element = self.data.pop()
            self.top_idx -= 1
            return element
        else:
            raise Exception('Stack is empty')

    @property
    def size(self):
        return len(self.data)

    @property
    def is_empty(self):
        # return True if self.size == 0 else False
        return True if self.top_idx == -1 else False

    @property
    def top(self):
        return self.top_idx

    @property
    def bottom(self):
        return self.bottom_idx

    @property
    def top_element(self):
        return self.data[-1] if len(self.data) > 0 else None

    @property
    def bottom_element(self):
        return self.data[0] if len(self.data) > 0 else None
```


```python
linked_stack = LinkedStack()
```


```python
linked_stack_number_of_elements_to_push = 20
pushed_sequence_linked_stack = list()
for i in range(linked_stack_number_of_elements_to_push):
    tmp_element = randint(10, 100)
    linked_stack.push(tmp_element)
    pushed_sequence_linked_stack.append(tmp_element)

print('Number of elements pushed: ', len(pushed_sequence_linked_stack))
print('Pushed sequendce => ', pushed_sequence_linked_stack, '\n')
print(linked_stack)
print()
```

    Number of elements pushed:  20
    Pushed sequendce =>  [58, 78, 83, 78, 36, 74, 56, 62, 89, 11, 15, 66, 24, 45, 61, 58, 95, 19, 36, 59] 
    
    [59] <- top
    [36]
    [19]
    [95]
    [58]
    [61]
    [45]
    [24]
    [66]
    [15]
    [11]
    [89]
    [62]
    [56]
    [74]
    [36]
    [78]
    [83]
    [78]
    [58] <- bottom
    



```python
popped_sequence_linked_stack = [linked_stack.pop()for i in range(linked_stack_number_of_elements_to_push - randint(2, linked_stack_number_of_elements_to_push - 2))]
print('Number of elements popped: ', len(popped_sequence_linked_stack))
print('Popped sequendce => ', popped_sequence_linked_stack, '\n')
print(linked_stack)
print()

```

    Number of elements popped:  5
    Popped sequendce =>  [59, 36, 19, 95, 58] 
    
    [61] <- top
    [45]
    [24]
    [66]
    [15]
    [11]
    [89]
    [62]
    [56]
    [74]
    [36]
    [78]
    [83]
    [78]
    [58] <- bottom
    


### (Test) Push element speed comparison


```python
def time_push(number_of_iterations, stack_obj):
    time_all_iterations = None
    time_per_operation  = []

    start_time_all_iterations = time.time()
    for i in range(number_of_iterations):
        random_number = randint(0,100)
        
        start_time_per_operation = time.time()
        stack_obj.push(random_number)
        end_time_per_operation   = time.time()

        delta_t = end_time_per_operation - start_time_per_operation
        time_per_operation.append(delta_t)
        
    end_time_all_iterations = time.time()

    time_all_iterations = end_time_all_iterations - start_time_all_iterations
    avg_time_per_operation = sum(time_per_operation)/len(time_per_operation)

    return time_all_iterations, avg_time_per_operation
```


```python
test_number_of_iteratons = 100_000

print('\nTesting Push operation\n')

test_sequential_stack  = SequentialStack(test_push_number_of_iteratons)
test_linked_stack      = LinkedStack()
test_linked_node_stack = LinkedNodeStack()

push_sequential_stack_time_for_all_iterations, push_sequential_stack_avg_time_per_operations   = time_push(test_number_of_iteratons, test_sequential_stack)
push_linked_stack_time_for_all_iterations, push_linked_stack_avg_time_per_operations           = time_push(test_number_of_iteratons, test_linked_stack)
push_linked_node_stack_time_for_all_iterations, push_linked_node_stack_avg_time_per_operations = time_push(test_number_of_iteratons, test_linked_node_stack)

print('\nSequential Stack')
print('Time for all iterations: ', push_sequential_stack_time_for_all_iterations)
print('Avg time per operation:  ', push_sequential_stack_avg_time_per_operations)

print('\nLinked Stack')
print("This stack utilizes Python's in-built list() type. Therefore, it will have the best performance in terms of tme.")
print('Time for all iterations: ', push_linked_stack_time_for_all_iterations)
print('Avg time per operation:  ', linked_stack_avg_time_per_operations)

print('\nLinked Node Stack')
print('Time for all iterations: ', push_linked_node_stack_time_for_all_iterations)
print('Avg time per operation:  ', push_linked_node_stack_avg_time_per_operations)
```

    
    Testing Push operation
    
    
    Sequential Stack
    Time for all iterations:  0.22549724578857422
    Avg time per operation:   7.430005073547363e-07
    
    Linked Stack
    This stack utilizes Python's in-built list() type. Therefore, it will have the best performance in terms of tme.
    Time for all iterations:  0.1650378704071045
    Avg time per operation:   3.8222551345825195e-07
    
    Linked Node Stack
    Time for all iterations:  267.0029981136322
    Avg time per operation:   0.0026655999803543093


<br><br>

In analyzing the iteration performance, it is evident that the Linked (Node) Stack exhibits the poorest performance overall. This is primarily attributed to the necessity of iterating through each node until reaching the last one, leading to considerable time consumption. In terms of Time Complexity, the Sequential Stack demonstrates superiority due to its efficient structure. However, this advantage comes at the cost of increased space utilization, as the Sequential Stack requires substantial memory allocation for data storage.

Examining the average time taken per push operation further accentuates the Sequential stack's superiority. Its direct indexing of the allocated memory space for the intended object during each iteration enables swift pushing. In contrast, the Linked (Node) Stack necessitates traversing all nodes in the Linked List to reach the final node and update its next_node pointer with the current object, resulting in slower performance.

###  (Test) Pop element speed comparison


```python
def time_pop(number_of_iterations, stack_obj):
    time_all_iterations = None
    time_per_operation  = []

    start_time_all_iterations = time.time()
    for i in range(number_of_iterations):
        
        start_time_per_operation = time.time()
        stack_obj.pop()
        end_time_per_operation   = time.time()

        delta_t = end_time_per_operation - start_time_per_operation
        time_per_operation.append(delta_t)
        
    end_time_all_iterations = time.time()

    time_all_iterations = end_time_all_iterations - start_time_all_iterations
    avg_time_per_operation = sum(time_per_operation)/len(time_per_operation)

    return time_all_iterations, avg_time_per_operation
```


```python
print('\nTesting Pop operation\n')

pop_sequential_stack_time_for_all_iterations, pop_sequential_stack_avg_time_per_operations   = time_pop(test_number_of_iteratons, test_sequential_stack)
pop_linked_stack_time_for_all_iterations, pop_linked_stack_avg_time_per_operations           = time_pop(test_number_of_iteratons, test_linked_stack)
pop_linked_node_stack_time_for_all_iterations, pop_linked_node_stack_avg_time_per_operations = time_pop(test_number_of_iteratons, test_linked_node_stack)

print('\nSequential Stack')
print('Time for all iterations: ', pop_sequential_stack_time_for_all_iterations)
print('Avg time per operation:  ', pop_sequential_stack_avg_time_per_operations)

print('\nLinked Stack')
print("This stack utilizes Python's in-built list() type. Therefore, it will have the best performance in terms of tme.")
print('Time for all iterations: ', pop_linked_stack_time_for_all_iterations)
print('Avg time per operation:  ', pop_linked_stack_avg_time_per_operations)

print('\nLinked Node Stack')
print('Time for all iterations: ', pop_linked_node_stack_time_for_all_iterations)
print('Avg time per operation:  ', pop_linked_node_stack_avg_time_per_operations)
```

    
    Testing Pop operation
    
    
    Sequential Stack
    Time for all iterations:  0.11483001708984375
    Avg time per operation:   8.0641508102417e-07
    
    Linked Stack
    This stack utilizes Python's in-built list() type. Therefore, it will have the best performance in terms of tme.
    Time for all iterations:  0.07549548149108887
    Avg time per operation:   5.283856391906738e-07
    
    Linked Node Stack
    Time for all iterations:  348.05520272254944
    Avg time per operation:   0.003479842984676361


<br><br>

In analyzing the iteration performance, it is evident that the Linked (Node) Stack exhibits the poorest performance overall. This is primarily attributed to the necessity of iterating through each node until reaching the last one, leading to considerable time consumption. In terms of Time Complexity, the Sequential Stack demonstrates superiority due to its efficient structure. However, this advantage comes at the cost of increased space utilization, as the Sequential Stack requires substantial memory allocation for data storage.

Examining the average time taken per pop operation further accentuates the Sequential stack's superiority. Its direct indexing of the allocated memory space for the intended object during each iteration enables swift pushing. In contrast, the Linked (Node) Stack necessitates traversing all nodes in the Linked List to reach the node before the final node and update its next_node pointer, resulting in slower performance.

---

## Applications

### Expression Calculatоr

1. Infix: \<operand_1\> \<operation_symbol\> \<operand_2\>
2. Prefix: \<operation_symbol\> \<operand_1\> \<operand_2\>
3. Postfix: \<operand_1\> \<operand_2\> \<operation_symbol\>


```python
operations_priority = dict()
operations_priority['isp'] = dict()
operations_priority['icp'] = dict()

operations_list = ['(', '*', '/', '%', '+', '-', ')']


# ISP
# In Stack Precedence
operations_priority['isp']['#'] = 0
operations_priority['isp']['('] = 1
operations_priority['isp']['*'] = 5
operations_priority['isp']['/'] = 5
operations_priority['isp']['%'] = 5
operations_priority['isp']['+'] = 3
operations_priority['isp']['-'] = 3
operations_priority['isp'][')'] = 6

# ICP
# Incomming Precedence 
operations_priority['icp']['#'] = 0
operations_priority['icp']['('] = 6
operations_priority['icp']['*'] = 4
operations_priority['icp']['/'] = 4
operations_priority['icp']['%'] = 4
operations_priority['icp']['+'] = 2
operations_priority['icp']['-'] = 2
operations_priority['icp'][')'] = 1

def infix_to_postfix(expression:str):
    step_count  = 0
    steps_list  = list()
    output_str  = ''

    linked_stack = LinkedStack()
    linked_stack.push('#')

    for expression_character in expression:
        # print('Current Character => ', expression_character)
        stack_top = linked_stack.top_element
        # print('[Before Logic] Top element => ', stack_top)
        
        if expression_character not in operations_list:
            output_str += expression_character
        else:
            # expression_character is an operation 
            if operations_priority['icp'][expression_character] > operations_priority['isp'][stack_top]:
                # print('[icp] > [isp] [PUSH]')
                linked_stack.push(expression_character)
            elif operations_priority['icp'][expression_character] < operations_priority['isp'][stack_top]:
                # print('[icp] < [isp] [POP]')
                popped_element = linked_stack.pop()
                stack_top      = linked_stack.top_element
                output_str += popped_element
                while operations_priority['icp'][expression_character] <= operations_priority['isp'][stack_top]:
                    # print('[icp] < [isp] [POP] until ([icp] > [isp])')
                    if stack_top == '(':
                        linked_stack.pop()
                        break
                    popped_element = linked_stack.pop()
                    stack_top      = linked_stack.top_element
                    output_str += popped_element
            else:
                # print('[icp] == [isp] [POP] until ([icp] > [isp])')
                popped_element = linked_stack.pop()
                while popped_element != '(':
                    output_str += popped_element
                    popped_element = linked_stack.pop()
                else: 
                    popped_element = linked_stack.pop()
                    continue
                    
    while linked_stack.top_element != '#':
        output_str += linked_stack.pop()

    return output_str
```


```python
infix_expression   = 'A+B*(C-D)-E/F'
postfix_expression = infix_to_postfix(infix_expression)

print('Infix   Expression: ', infix_expression)
print('Postfix Expression: ', postfix_expression)
```

    ABCD-*+EF/


### Maze Solver

#### Description:

The problem involves navigating through a maze represented as a 2D array of size MxN, where each element contains either a 0 (indicating a walkable path) or a 1 (representing a wall). A person or an entity starts at a designated entry point and aims to reach the exit of the maze, moving only to adjacent elements in one of the eight directions (N, NE, E, SE, S, SW, W, NW).

#### Algorithm:

1. Initialize a stack data structure to store the current path being explored.
2. Start at the entry point of the maze.
3. Push the starting position onto the stack.
4. While the stack is not empty:
    1. Pop the top element from the stack.
    2. Check if the popped element is the exit point.
        1. If yes, the maze is solved; exit the algorithm.
    3. Explore adjacent cells in all eight directions.
        1. If an adjacent cell is a valid move (not a wall and within the maze boundaries) and has not been visited:
            1. Push this cell onto the stack.
            2. Mark the cell as visited.
   
If the stack becomes empty and the exit hasn’t been found, the maze has no solution.

#### Notes:

This approach utilizes a depth-first search (DFS) strategy by traversing as far as possible along each branch before backtracking.

The stack is used to keep track of the path taken, allowing the algorithm to backtrack when no further moves are possible from a given position.

Implementations may vary based on programming languages and specific data structures used for the stack and maze representation.


```python
maze_matrix = [
    [1 for i in range(0, 17) ],
    [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1 ],
    [1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1 ],
    [1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1 ],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1 ],
    [1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1 ],
    [1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1 ],
    [1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    [1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1 ],
    [1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1 ],
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1 ],
    [1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0 ],    
    [1 for i in range(0, 17) ]
    
]

move_directions = [
    {"direction": "N",   "i": -1, "j":  0},
    {"direction": "NE",  "i": -1, "j":  1},
    {"direction": "E",   "i":  0, "j":  1},
    {"direction": "SE",  "i":  1, "j":  1},
    {"direction": "S",   "i":  1, "j":  0},
    {"direction": "SW",  "i":  1, "j": -1},
    {"direction": "W",   "i":  0, "j": -1},
    {"direction": "NW",  "i": -1, "j": -1},
]


```


```python
def path_around_wall(maze_matrix, move_directions, maze_width, maze_height, maze_exit_x, maze_exit_y, print_stack=False):
    # Inicialization
    walked_path_mark = [ [0 for i in range(0, 17) ] for j in range(0, 14) ]

    # Preprocessing
    walked_path_mark[1][0] = 1
    _stack = LinkedStack()
    starting_position = {'x':1, 'y':1, 'direction':0}

    _stack.push(starting_position)

    while not _stack.is_empty:
        current_item = _stack.pop()
        i = current_item['x']
        j = current_item['y']
        d = current_item['direction']

        while d < 8:
            g = i + move_directions[d]['i']
            h = j + move_directions[d]['j']
            direction_name = move_directions[d]['direction']

            is_current_direction_a_wall       = True if maze_matrix[g][h] == 1 else False
            has_current_direction_been_walked = True if walked_path_mark[g][h] == 1 else False

            # print(f'Direction is {direction_name} [{d}] < 8')
            # print(f'g: {g} \th: {h}')
            # print(f'in the maze_this is [{maze_matrix[g][h]}]')
            # print(f'is_wall:{is_current_direction_a_wall}')
            # print(f'walked: {has_current_direction_been_walked}')

            if ((g == maze_exit_x) and (h == maze_exit_y)):
                walked_position = {}
                walked_position['x'] = i
                walked_position['y'] = j
                walked_position['direction'] = d

                _stack.push(walked_position)

                final_position = {}
                final_position['x'] = g
                final_position['y'] = h
                final_position['direction'] = 2

                _stack.push(final_position)
                    
                if print_stack:
                    print('Exiting Maze\n')
                    print(_stack)
                return _stack

            if ((g == maze_width) and (h == maze_height)):
                if print_stack:
                    print('Direction Stack\n')
                    print(_stack)
                    print(f"m: {maze_width}\tp: {maze_height}")
                return _stack

            if (not is_current_direction_a_wall) and (not has_current_direction_been_walked):
                walked_path_mark[g][h] = 1
                # print(f'Walking on [{g}][{h}] \t In the maze it is [{maze_matrix[g][h]}]')
                # print(f'Walking on [{g}][{h}]')

                walked_position = {}
                walked_position['x'] = i
                walked_position['y'] = j
                walked_position['direction'] = d

                _stack.push(walked_position)

                i = g
                j = h
                d = 0
            else:
                d += 1

    print('No path in maze')
    
```


```python
print_path = [ ['-' for i in range(0, 17) ] for j in range(0, 14) ]
print_path[1][0] = 'o'

path_stack = path_around_wall(
        maze_matrix=maze_matrix, 
        move_directions=move_directions, 
        maze_width=14,
        maze_height=17, 
        maze_exit_x=12, 
        maze_exit_y=16)


while not path_stack.is_empty:
    current_position = path_stack.pop()
    _x = current_position['x']
    _y = current_position['y']
    print_path[_x][_y] = 'o'

for l in print_path:
    print(l)
```

    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['o', 'o', '-', 'o', 'o', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', 'o', '-', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', '-', '-', 'o', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', '-', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', '-', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', 'o', '-', '-', '-', '-', 'o', 'o', '-', '-', '-', '-', '-', '-', '-', '-', '-']
    ['-', '-', 'o', '-', '-', 'o', '-', '-', 'o', '-', '-', '-', '-', '-', 'o', '-', '-']
    ['-', '-', '-', 'o', 'o', '-', '-', '-', 'o', '-', '-', 'o', 'o', 'o', '-', 'o', '-']
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', 'o', 'o', '-', '-', '-', '-', 'o', '-']
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'o']
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
