import * as ac from 'astro:content';
import * as s from '../../governance/information-model/schemas';

export const aboutusSevicesCollection = ac.defineCollection({ schema: s.consultingSevicesSchema });

export default aboutusSevicesCollection;