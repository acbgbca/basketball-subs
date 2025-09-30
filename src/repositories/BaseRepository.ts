/**
 * Abstract base repository class providing common CRUD operations
 * @template T - The entity type this repository manages
 */
export abstract class BaseRepository<T> {
  /**
   * Save an entity to storage
   * @param entity - The entity to save
   * @returns Promise that resolves when save is complete
   */
  abstract save(entity: T): Promise<void>;

  /**
   * Find an entity by its ID
   * @param id - The unique identifier of the entity
   * @returns Promise that resolves to the entity or null if not found
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find all entities of this type
   * @returns Promise that resolves to an array of all entities
   */
  abstract findAll(): Promise<T[]>;

  /**
   * Delete an entity by its ID
   * @param id - The unique identifier of the entity to delete
   * @returns Promise that resolves when deletion is complete
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Update an existing entity
   * @param entity - The entity with updated data
   * @returns Promise that resolves when update is complete
   */
  abstract update(entity: T): Promise<void>;

  /**
   * Check if an entity exists by ID
   * @param id - The unique identifier to check
   * @returns Promise that resolves to true if entity exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  /**
   * Get the count of all entities
   * @returns Promise that resolves to the total count
   */
  async count(): Promise<number> {
    const entities = await this.findAll();
    return entities.length;
  }

  /**
   * Find entities that match a predicate function
   * @param predicate - Function to test each entity
   * @returns Promise that resolves to array of matching entities
   */
  async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    const entities = await this.findAll();
    return entities.filter(predicate);
  }

  /**
   * Find the first entity that matches a predicate function
   * @param predicate - Function to test each entity
   * @returns Promise that resolves to the first matching entity or null
   */
  async findFirst(predicate: (entity: T) => boolean): Promise<T | null> {
    const entities = await this.findAll();
    return entities.find(predicate) || null;
  }
}

/**
 * Interface for repositories that support batch operations
 */
export interface BatchRepository<T> {
  saveMany(entities: T[]): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  updateMany(entities: T[]): Promise<void>;
}