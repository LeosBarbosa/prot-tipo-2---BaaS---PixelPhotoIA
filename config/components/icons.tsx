/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

const createIcon = (path: React.ReactNode) => {
  const IconComponent: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {path}
    </svg>
  );
  return IconComponent;
};

const createSolidIcon = (path: React.ReactNode) => {
    const IconComponent: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        {path}
      </svg>
    );
    return IconComponent;
  };

export const HomeIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />);
export const SparkleIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />);
export const PaletteIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-.617-6.228l-2.165 2.165a1.125 1.125 0 0 1-1.59 0l-1.59-1.59a1.125 1.125 0 0 1 0-1.59l2.165-2.165a3.75 3.75 0 0 0-6.228-.617l-6.402 6.402a3.75 3.75 0 0 0 0 5.304Zm1.13-1.13a2.25 2.25 0 0 1 0-3.182l6.402-6.402a2.25 2.25 0 0 1 3.182 0l-1.13 1.13-1.59-1.59a2.625 2.625 0 0 0-3.712 0L5.228 17.64l1.13 1.13Z" />);
export const SunIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />);
export const MoonIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />);
export const UndoIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />);
export const RedoIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />);
export const SaveIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.663V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-4.16a2.25 2.25 0 00-.1-.663l-2.412-7.85a2.25 2.25 0 00-2.15-1.588H15M12 9v6m3-3H9" />);
export const UploadIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />);
export const LayersIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L12 7.5l5.571 2.25M3.75 7.5h16.5v9H3.75v-9z" />);
export const AdjustmentsHorizontalIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />);
export const DownloadIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />);
export const CloseIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />);
export const CompareArrowsIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m-14.995 0l3.182-3.182a8.25 8.25 0 0111.667 0l3.182 3.182" />);
export const HandIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />);
export const ZoomOutIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />);
export const ZoomInIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />);
export const SplitScreenIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />);
export const WorkflowIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 0 1 0 2.25H5.625a1.125 1.125 0 0 1 0-2.25Z" />);
export const EyeIcon = createIcon((<><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.25-7.5a1.012 1.012 0 0 1 1.736 0l4.25 7.5a1.012 1.012 0 0 1 0 .639l-4.25 7.5a1.012 1.012 0 0 1-1.736 0l-4.25-7.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></>));
export const SearchIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />);
export const ChevronDownIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />);
export const GenerationIcon = SparkleIcon;
export const EditingIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />);
export const FaceSmileIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9.75h.008v.008H9V9.75Zm6 0h.008v.008H15V9.75Z" />);
export const CombineIcon = createIcon(<path d="M12 18a6 6 0 100-12 6 6 0 000 12zM18 12a6 6 0 11-12 0 6 6 0 0112 0z" />);
export const BullseyeIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />);
export const CloneIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />);
export const UserIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />);
export const SwapIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />);
export const PhotoIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />);
export const BrushIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />);
export const AspectRatioSquareIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />);
export const AspectRatioLandscapeIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75ZM21 9.75h-2.25M21 14.25h-2.25M3 9.75h2.25M3 14.25h2.25" />);
export const AspectRatioPortraitIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75ZM9.75 21V18.75m4.5 2.25V18.75M9.75 3v2.25m4.5-2.25v2.25" />);
export const CropIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h12A2.25 2.25 0 0 0 20.25 18V16.5M7.5 3.75v.75m0-3.75-3 3m3-3h.75m0-3.75h3.75a2.25 2.25 0 0 1 2.25 2.25v3.75m0 0h3.75m-3.75 0h.75m0 0-3 3m3-3v.75" />);
export const ExpandIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />);
export const MagicWandIcon = SparkleIcon;
export const EraserIcon = createIcon((<><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5-7.5-7.5 7.5-7.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5M11.25 4.5l-7.5 7.5M3.75 12l7.5 7.5m-7.5-7.5 7.5-7.5m7.5 7.5 3.75-3.75m-3.75 3.75-3.75-3.75" /></>));
export const ScissorsIcon = createIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M6 8a4 4 0 108 0 4 4 0 00-8 0zM6 16a4 4 0 108 0 4 4 0 00-8 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12L4.5 4.5m15 15L12 12" /></>);
export const TextToolIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M7.5 4.5v15" />);
export const ArrowUpOnSquareIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V3" />);
export const UnblurIcon = SparkleIcon;
export const SharpenIcon = createIcon((<><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5 7.5 7.5-7.5" /></>));
export const LowPolyIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5-7.5-7.5 7.5-7.5Z" />);
export const PixelsIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />);
export const TextureIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.125 1.125 0 0 0-.11 1.963l.135.48a1.125 1.125 0 0 0 1.11.858l.28.01a1.125 1.125 0 0 1 1.023.242l.22.22a1.125 1.125 0 0 0 .848.354l.516-.02a1.125 1.125 0 0 1 1.152.968l.096.432c.056.251.34.417.616.36l.618-.138a1.125 1.125 0 0 0 .29-.168l.292-.292a1.125 1.125 0 0 1 .39-.311l.22-.099c.278-.124.39-.452.24-.728l-.136-.248a1.125 1.125 0 0 0-.258-.582l-.346-.519a1.125 1.125 0 0 1 .162-1.55l.422-.387a1.125 1.125 0 0 0 .162-1.55l-.422-.387a1.125 1.125 0 0 1-.162-1.55l.346-.519a1.125 1.125 0 0 0 .258-.582l.136-.248c.15-.276.038-.604-.24-.728l-.22-.099a1.125 1.125 0 0 1-.39-.311l-.292-.292a1.125 1.125 0 0 0-.29-.168l-.618-.138c-.276-.057-.56.109-.616.36l-.096.432a1.125 1.125 0 0 1-1.152.968l-.516-.02a1.125 1.125 0 0 0-.848.354l-.22.22a1.125 1.125 0 0 1-1.023.242l-.28.01a1.125 1.125 0 0 0-1.11.858l-.135.48a1.125 1.125 0 0 0 .11 1.963l.143.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.226 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568a1.125 1.125 0 0 0 2.25 0Z" />);
export const FilmGrainIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm.002-2.99a5.996 5.996 0 0 0 4.238-1.759 5.996 5.996 0 0 0-8.475 0 5.996 5.996 0 0 0 4.237 1.759Z" />);
export const LightbulbIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 18v.01M7.707 4.293l-1.414 1.414M1.757 12l1.414 1.414M4.293 19.293l1.414-1.414M12 1.757l1.414 1.414m5.657 4.23l-1.414 1.414M19.707 4.293l-1.414 1.414M12 6a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />);
export const ClockIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />);
export const CheckCircleIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />);
export const InformationCircleIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />);
export const PauseIcon = createIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75h1.5v4.5H9zm4.5 0h1.5v4.5H13.5z" /></>);
export const PlayIcon = createIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></>);
export const BananaIcon = createSolidIcon(<path d="M16.014 4.34C15.823 4.217 15.65 4.1 15.42 4H14V2H12v2H10V2H8v2H5.617c-.244.11-2.016 1.1-2.203 1.281C1.332 7.214 4.004 12.5 4 12.5c.002.002.004.004.006.006C4.062 12.87 4.18 13.22 4.363 13.5H4c-1.103 0-2 .897-2 2s.897 2 2 2h1v1h2v-1h6v1h2v-1h1c1.103 0 2-.897 2-2s-.897-2-2-2h-.363c.184-.28.301-.63.357-.994.002-.002.004-.004.006-.006.004-.002 2.668-5.286.586-7.219L16.5 4.719c-.16-.109-.327-.215-.486-.379z"/>);
export const CaricatureIcon = createSolidIcon(<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.28 15.2c-.39 0-.71-.39-.71-.88 0-.49.32-.88.71-.88.4 0 .72.39.72.88 0 .49-.32.88-.72.88zm2.56 0c-.39 0-.71-.39-.71-.88 0-.49.32-.88.71-.88.4 0 .72.39.72.88 0 .49-.32.88-.72.88zm2.4-4.83c-.32-.27-.7-.37-1.03-.29-.32.08-.6.28-.79.55-.37.53-1.04.83-1.74.83s-1.37-.3-1.74-.83c-.19-.27-.47-.47-.79-.55-.33-.08-.71.02-1.03.29-.63.53-1.63 1-2.82 1.15.13-.5.21-.9.21-1.32 0-2.31-1.88-4.19-4.19-4.19-.18 0-.35.01-.52.04.42-2.34 2.44-4.12 4.9-4.12 2.76 0 5 2.24 5 5 0 .28-.03.55-.08.81.47-.52 1.13-.81 1.83-.81 1.38 0 2.5 1.12 2.5 2.5 0 .21-.03.42-.08.62.59-.28 1.25-.43 1.95-.43 2.01 0 3.74 1.34 4.19 3.19-.17-.03-.34-.04-.52-.04-2.31 0-4.19 1.88-4.19 4.19 0 .42.08.82.21 1.21-1.13-.15-2.12-.62-2.75-1.15z"/>);
export const PixarIcon = createIcon(<path d="M12 2.5c-4.04 0-7.33 2.5-7.33 5.58 0 1.85.92 3.5 2.36 4.56-1.4.93-2.36 2.3-2.36 3.86 0 2.2 1.79 4 4 4 .98 0 1.87-.29 2.61-.78.74.49 1.63.78 2.61.78 2.21 0 4-1.8 4-4 0-1.56-.96-2.93-2.36-3.86 1.44-1.06 2.36-2.71 2.36-4.56C19.33 5 16.04 2.5 12 2.5z" />);
export const ToyIcon = createSolidIcon(<path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM9 9c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1zm6 0c.552 0 1 .448 1 1s-.448 1-1 1-1-.448-1-1 .448-1 1-1zm-3 8c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />);
export const LogoIcon = createIcon(<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />);
export const Model3DIcon = createIcon(<path d="m21 12-9-9-9 9 9 9 9-9zM3.86 12l8.14-8.14L20.14 12l-8.14 8.14L3.86 12z" />);
export const PatternIcon = createIcon(<path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />);
export const StickersIcon = createIcon(<path d="M3.293 3.293a1 1 0 0 1 1.414 0L12 10.586l7.293-7.293a1 1 0 1 1 1.414 1.414L13.414 12l7.293 7.293a1 1 0 0 1-1.414 1.414L12 13.414l-7.293 7.293a1 1 0 0 1-1.414-1.414L10.586 12 3.293 4.707a1 1 0 0 1 0-1.414z" />);
export const TextEffectsIcon = createIcon(<path d="M9.64 4.25a.75.75 0 0 1 .53 1.28l-3.23 3.22a.75.75 0 0 1-1.06 0L2.65 5.53a.75.75 0 0 1 1.06-1.06l1.97 1.97 3.96-3.19zM19.5 4.5h-5.25a.75.75 0 0 1 0-1.5h5.25a.75.75 0 0 1 0 1.5zm0 4.5h-5.25a.75.75 0 0 1 0-1.5h5.25a.75.75 0 0 1 0 1.5zm0 4.5h-5.25a.75.75 0 0 1 0-1.5h5.25a.75.75 0 0 1 0 1.5zm0 4.5h-5.25a.75.75 0 0 1 0-1.5h5.25a.75.75 0 0 1 0 1.5z" />);
export const VectorIcon = createIcon(<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />);
export const StraightHairIcon = createIcon(<path d="M4 3h1v16H4zm3 0h1v16H7zm3 0h1v16h-1zm3 0h1v16h-1zm3 0h1v16h-1z" />);
export const WavyHairIcon = createIcon(<path d="M3 3s4 2 4 8-4 8-4 8m5-16s4 2 4 8-4 8-4 8m5-16s4 2 4 8-4 8-4 8m5-16s4 2 4 8-4 8-4 8" />);
export const CurlyHairIcon = createIcon(<path d="M2 5c0 3 2 4 4 4s4-1 4-4-2-4-4-4-4 1-4 4zm8 0c0 3 2 4 4 4s4-1 4-4-2-4-4-4-4 1-4 4zm-8 8c0 3 2 4 4 4s4-1 4-4-2-4-4-4-4 1-4 4zm8 0c0 3 2 4 4 4s4-1 4-4-2-4-4-4-4 1-4 4z" />);
export const AfroHairIcon = createIcon(<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />);
export const BraidsHairIcon = createIcon(<path d="M4 3v18M8 3v18M12 3v18M16 3v18M20 3v18" />);
export const DenoiseIcon = createIcon(<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 9h6v6H9V9z" />);
export const RotateLeftIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6-6m0 0l6-6m-6 6h12a6 6 0 0 0 0-12h-3" />);
export const RotateRightIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m9 15 6-6m0 0-6-6m6 6H3a6 6 0 0 0 0 12h3" />);
export const FlipHorizontalIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m-3 3 6 0m-6 3 6 0m-6 3 6 0m-6 3 6 0" />);
export const FlipVerticalIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m-3-3 0 6m-3-6 0 6m-3-6 0 6m-3-6 0 6" />);
export const ToneCurveIcon = createIcon(<path d="M3 3v18h18M3 18s4-10 10-10 8 10 8 10" />);
export const PngIcon = createIcon(<path d="M4 4h16v16H4zM4 10h4v4H4zm4-4h4v4H8z" />);
export const AnimeFaceIcon = createIcon(<path d="M12 2c-5 0-9 4.33-9 9.67 0 3.32 1.67 6.25 4.19 7.91.47.31.81.76.92 1.28l.44 2.14h7l.44-2.14c.11-.52.45-.97.92-1.28C19.33 17.92 21 15 21 11.67 21 6.33 17 2 12 2z" />);
export const BoltIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />);
export const CameraIcon = createIcon((<><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></>));
export const LegoIcon = createIcon(<path d="M4 4h16v16H4z" />);
export const GtaIcon = createIcon(<path d="M12 2L2 7l10 5 10-5-10-5z" />);
export const DoubleExposureIcon = createIcon(<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />);
export const SuperheroIcon = createIcon(<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />);
export const MapPinIcon = createIcon((<><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-8-6.143-8-11.643C4 5.613 7.582 2 12 2s8 3.613 8 7.357C20 14.857 12 21 12 21Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></>));
export const ClipboardIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75V2.25a1.125 1.125 0 0 0-1.125-1.125H9.375A1.125 1.125 0 0 0 8.25 2.25v1.5M16.5 6H7.5a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 7.5 21h9a2.25 2.25 0 0 0 2.25-2.25V8.25A2.25 2.25 0 0 0 16.5 6Z" />);
export const MicrophoneIcon = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8.25a3 3 0 0 1-3 3Z" />);
export const PolaroidIcon = createIcon(<path d="M4 4h16v16H4z" />);
export const ShirtIcon = createIcon(<path d="M12 2L2 7l10 5 10-5-10-5z" />);