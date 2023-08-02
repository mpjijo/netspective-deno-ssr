import * as ac from 'astro:content';
import * as s from '../../governance/information-model/schemas';

export const thoughtleadershipSevicesCollection = ac.defineCollection({ schema: s.consultingSevicesSchema });

export default thoughtleadershipSevicesCollection;