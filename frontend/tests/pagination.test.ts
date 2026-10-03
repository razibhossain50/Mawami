import { getPageItems } from '../src/services/pagination';

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses gaps around the current page', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('has no leading gap near the start or trailing gap near the end', () => {
    expect(getPageItems(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
    expect(getPageItems(9, 10)).toEqual([1, 'ellipsis', 8, 9, 10]);
  });
});
