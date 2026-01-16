import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

describe('Public Decorator', () => {
  it('should be defined', () => {
    expect(Public).toBeDefined();
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should export IS_PUBLIC_KEY as "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toEqual('isPublic');
  });

  it('Public should be a function', () => {
    expect(typeof Public).toBe('function');
  });

  it('should set metadata when applied to a class', () => {
    const reflector = new Reflector();

    // Create a test class and apply decorator
    @Public()
    class TestController {}

    // Check if metadata is set on the class
    const isPublic = reflector.get(IS_PUBLIC_KEY, TestController);

    expect(isPublic).toBe(true);
  });

  it('should set metadata when applied to a method', () => {
    const reflector = new Reflector();

    // Create a test class with decorated method
    class TestController {
      @Public()
      testMethod() {}
    }

    // Check if metadata is set on the method
    // Reflector.get() signature: get<T>(metadataKey: any, target: Function)
    // We need to get the descriptor from the prototype
    const isPublic = reflector.get(IS_PUBLIC_KEY, TestController.prototype.testMethod);

    expect(isPublic).toBe(true);
  });

  it('should not affect non-decorated methods', () => {
    const reflector = new Reflector();

    class TestController {
      testMethod() {}
    }

    const isPublic = reflector.get(IS_PUBLIC_KEY, TestController.prototype.testMethod);

    expect(isPublic).toBeUndefined();
  });
});
